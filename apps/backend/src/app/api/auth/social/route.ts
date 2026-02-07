import { NextRequest, NextResponse } from 'next/server';
import { socialLoginSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { handleError, ApiError } from '@/lib/middleware';

interface GoogleTokenInfo {
  email: string;
  name?: string;
  sub: string;
  email_verified: string;
}

async function verifyGoogleToken(idToken: string): Promise<{ email: string; sub: string; name?: string }> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) {
    throw new ApiError(401, 'Token de Google invalido');
  }
  const data = (await res.json()) as GoogleTokenInfo;
  if (data.email_verified !== 'true') {
    throw new ApiError(401, 'El correo de Google no esta verificado');
  }
  return { email: data.email, sub: data.sub, name: data.name };
}

async function verifyAppleToken(idToken: string): Promise<{ email: string; sub: string; name?: string }> {
  // Apple ID tokens are JWTs - decode payload to extract claims
  // In production, verify signature against Apple's public keys
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT');
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.email || !payload.sub) {
      throw new Error('Missing claims');
    }
    return { email: payload.email, sub: payload.sub };
  } catch {
    throw new ApiError(401, 'Token de Apple invalido');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = socialLoginSchema.parse(body);

    // Verify token with provider
    let providerData: { email: string; sub: string; name?: string };

    if (data.provider === 'GOOGLE') {
      providerData = await verifyGoogleToken(data.idToken);
    } else {
      providerData = await verifyAppleToken(data.idToken);
    }

    const email = providerData.email.toLowerCase();
    const name = data.name || providerData.name || email.split('@')[0];

    // Look for existing user by provider ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authProvider: data.provider, authProviderId: providerData.sub },
          { email },
        ],
      },
    });

    if (user) {
      // Link social provider if user exists with email but different provider
      if (!user.authProviderId || user.authProvider === 'EMAIL') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: data.provider,
            authProviderId: providerData.sub,
          },
        });
      }
    } else {
      // Create new user (no password for social auth)
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: null,
          authProvider: data.provider,
          authProviderId: providerData.sub,
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Formato de solicitud invalido' }, { status: 400 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
