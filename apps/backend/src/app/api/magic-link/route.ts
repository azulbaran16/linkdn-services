import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { handleError, ApiError } from '@/lib/middleware';

// POST /api/magic-link - Send a magic link to client email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      throw new ApiError(400, 'Email requerido');
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { email },
    });

    if (!clientProfile) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: 'Si tienes reservas con ese correo, recibiras un enlace de acceso.',
      });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.magicLinkToken.create({
      data: {
        clientProfileId: clientProfile.id,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${appUrl}/api/magic-link/verify?token=${token}`;
    const deepLink = `linkdn-services://auth/magic?token=${token}`;

    await sendEmail(
      email,
      'Accede a tus reservas - LinkDN Services',
      `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1A1A1A;">Hola ${clientProfile.name},</h2>
        <p style="color: #4A4A4A;">Usa este enlace para acceder a tu historial de reservas:</p>
        <a href="${deepLink}"
           style="display: inline-block; background-color: #FF6B35; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          Acceder a mis reservas
        </a>
        <p style="color: #8E8E8E; font-size: 14px; margin-top: 24px;">
          Este enlace expira en 24 horas. Si no solicitaste este acceso, ignora este correo.
        </p>
        <p style="color: #8E8E8E; font-size: 12px;">
          Si el boton no funciona, copia este enlace: ${magicLinkUrl}
        </p>
      </div>
      `
    );

    return NextResponse.json({
      message: 'Si tienes reservas con ese correo, recibiras un enlace de acceso.',
    });
  } catch (error) {
    return handleError(error);
  }
}
