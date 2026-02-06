import { NextRequest, NextResponse } from 'next/server';
import { updateServiceSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);
    const body = await req.json();
    const data = updateServiceSchema.parse(body);

    // Verify service belongs to workspace
    const existing = await prisma.service.findFirst({
      where: { id: params.id, workspaceId: workspace.id },
    });
    if (!existing) {
      throw new ApiError(404, 'Servicio no encontrado');
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await withAuth(req);
    const workspace = await getWorkspace(userId);

    const existing = await prisma.service.findFirst({
      where: { id: params.id, workspaceId: workspace.id },
    });
    if (!existing) {
      throw new ApiError(404, 'Servicio no encontrado');
    }

    await prisma.service.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Servicio eliminado' });
  } catch (error) {
    return handleError(error);
  }
}
