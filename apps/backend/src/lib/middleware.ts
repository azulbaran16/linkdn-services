import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from './auth';
import { prisma } from './prisma';

// Extract and verify auth token from request, return user payload
export async function withAuth(req: NextRequest): Promise<JwtPayload> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Token de autorizacion requerido');
  }

  const token = authHeader.substring(7);
  try {
    return verifyToken(token);
  } catch {
    throw new AuthError('Token invalido o expirado');
  }
}

// Get the current user's workspace (throws if none exists)
export async function getWorkspace(userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { userId },
    include: {
      profile: true,
      categories: { include: { category: true } },
    },
  });
  if (!workspace) {
    throw new ApiError(404, 'No tienes un espacio de trabajo. Crea uno primero.');
  }
  return workspace;
}

// Custom error classes for clean error handling
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Wrapper to handle errors consistently
export function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}
