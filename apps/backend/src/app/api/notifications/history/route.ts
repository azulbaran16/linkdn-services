import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError } from '@/lib/middleware';

// GET /api/notifications/history - Get notification history
export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { workspaceId: workspace.id };
    if (clientId) where.clientProfileId = clientId;
    if (type) where.type = type;

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          clientProfile: { select: { name: true, email: true } },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
