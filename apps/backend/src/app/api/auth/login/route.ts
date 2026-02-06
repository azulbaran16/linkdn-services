import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { handleError, ApiError } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new ApiError(401, 'Correo o contrasena incorrectos');
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'Correo o contrasena incorrectos');
    }

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
