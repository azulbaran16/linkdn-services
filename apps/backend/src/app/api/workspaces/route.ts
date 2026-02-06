import { NextRequest, NextResponse } from 'next/server';
import { createWorkspaceSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const body = await req.json();
    const data = createWorkspaceSchema.parse(body);

    // Check if user already has a workspace
    const existing = await prisma.workspace.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ApiError(409, 'Ya tienes un espacio de trabajo');
    }

    const workspace = await prisma.workspace.create({
      data: {
        userId,
        type: data.type,
        name: data.name,
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
