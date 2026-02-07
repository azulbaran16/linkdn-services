import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { handleError, ApiError } from '@/lib/middleware';

// GET /api/magic-link/verify?token=xxx - Verify magic link and return a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      throw new ApiError(400, 'Token requerido');
    }

    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { clientProfile: true },
    });

    if (!magicLink) {
      throw new ApiError(404, 'Enlace invalido o expirado');
    }

    if (magicLink.expiresAt < new Date()) {
      throw new ApiError(410, 'Este enlace ha expirado. Solicita uno nuevo.');
    }

    if (magicLink.usedAt) {
      throw new ApiError(410, 'Este enlace ya fue utilizado. Solicita uno nuevo.');
    }

    // Mark as used
    await prisma.magicLinkToken.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Create a JWT for the client
    const clientToken = signToken({
      userId: magicLink.clientProfile.id,
      email: magicLink.clientProfile.email,
      isClient: true,
    });

    // Redirect to app with token
    const deepLink = `linkdn-services://auth/client?token=${clientToken}`;
    return NextResponse.redirect(deepLink);
  } catch (error) {
    return handleError(error);
  }
}
