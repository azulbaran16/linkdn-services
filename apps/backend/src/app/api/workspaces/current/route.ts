import { NextRequest, NextResponse } from 'next/server';
import { updateWorkspaceSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);
    return NextResponse.json({ workspace });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);
    const body = await req.json();
    const data = updateWorkspaceSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data,
    });

    return NextResponse.json({ workspace: updated });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
