import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

// PUT /api/notifications/rules/:id - Update a notification rule
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.notificationRule.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new ApiError(404, 'Regla no encontrada');
    }

    const rule = await prisma.notificationRule.update({
      where: { id },
      data: {
        type: body.type ?? existing.type,
        delayValue: body.delayValue ?? existing.delayValue,
        serviceId: body.serviceId !== undefined ? body.serviceId : existing.serviceId,
        template: body.template ?? existing.template,
        subject: body.subject ?? existing.subject,
        active: body.active !== undefined ? body.active : existing.active,
      },
      include: { service: { select: { name: true } } },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/notifications/rules/:id - Delete a notification rule
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;

    const existing = await prisma.notificationRule.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new ApiError(404, 'Regla no encontrada');
    }

    await prisma.notificationRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
