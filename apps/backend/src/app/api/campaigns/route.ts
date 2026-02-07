import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

// GET /api/campaigns - List campaigns for the current workspace
export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const body = await req.json();

    const { subject, message, audienceFilter, scheduledAt } = body;

    if (!subject || !message) {
      throw new ApiError(400, 'Asunto y mensaje son requeridos');
    }

    // Calculate recipient count based on audience filter
    const filter = audienceFilter || { type: 'all' };
    const whereClause: any = {
      bookings: { some: { workspaceId: workspace.id } },
    };

    if (filter.type === 'by_service' && filter.params?.serviceId) {
      whereClause.bookings.some.serviceId = filter.params.serviceId;
    }

    if (filter.type === 'by_last_visit' && filter.params?.daysAgo) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filter.params.daysAgo);
      whereClause.bookings.some.startTime = { lt: cutoff };
    }

    if (filter.type === 'frequent') {
      // Will filter after count
    }

    const potentialRecipients = await prisma.clientProfile.findMany({
      where: whereClause,
      include: {
        bookings: {
          where: { workspaceId: workspace.id },
          select: { id: true },
        },
      },
    });

    let recipients = potentialRecipients;
    if (filter.type === 'frequent') {
      recipients = potentialRecipients.filter((c) => c.bookings.length >= 3);
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: workspace.id,
        subject,
        message,
        audienceFilter: filter,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        recipientCount: recipients.length,
        recipients: {
          create: recipients.map((r) => ({
            clientProfileId: r.id,
            status: 'DRAFT',
          })),
        },
      },
    });

    return NextResponse.json({ campaign, recipientCount: recipients.length }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
