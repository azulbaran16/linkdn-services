import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

// GET /api/notifications/rules - List notification rules
export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);

    const rules = await prisma.notificationRule.findMany({
      where: { workspaceId: workspace.id },
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/notifications/rules - Create a notification rule
export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const body = await req.json();

    const { type, delayValue, serviceId, template, subject } = body;

    if (!type || !delayValue || !template) {
      throw new ApiError(400, 'Tipo, valor de delay y template son requeridos');
    }

    if (!['POST_SERVICE', 'PRE_APPOINTMENT'].includes(type)) {
      throw new ApiError(400, 'Tipo invalido');
    }

    const rule = await prisma.notificationRule.create({
      data: {
        workspaceId: workspace.id,
        type,
        delayValue,
        serviceId: serviceId || null,
        template,
        subject: subject || '',
        active: true,
      },
      include: { service: { select: { name: true } } },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
