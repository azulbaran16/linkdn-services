import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

// GET /api/campaigns/:id - Get campaign detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        recipients: {
          include: {
            clientProfile: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!campaign) {
      throw new ApiError(404, 'Campana no encontrada');
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/campaigns/:id - Update campaign (only DRAFT)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new ApiError(404, 'Campana no encontrada');
    }

    if (existing.status !== 'DRAFT') {
      throw new ApiError(400, 'Solo puedes editar campanas en borrador');
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        subject: body.subject ?? existing.subject,
        message: body.message ?? existing.message,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : existing.scheduledAt,
        status: body.scheduledAt ? 'SCHEDULED' : existing.status,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/campaigns/:id - Delete campaign (only DRAFT)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;

    const existing = await prisma.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!existing) {
      throw new ApiError(404, 'Campana no encontrada');
    }

    if (existing.status !== 'DRAFT') {
      throw new ApiError(400, 'Solo puedes eliminar campanas en borrador');
    }

    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
