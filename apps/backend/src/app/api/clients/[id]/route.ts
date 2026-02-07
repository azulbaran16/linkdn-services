import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

// GET /api/clients/:id - Get detailed client info
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { workspaceId: workspace.id },
          orderBy: { startTime: 'desc' },
          include: {
            service: { select: { name: true, priceFrom: true, durationMinutes: true } },
          },
        },
      },
    });

    if (!client) {
      throw new ApiError(404, 'Cliente no encontrado');
    }

    // Verify this client has bookings with this workspace
    if (client.bookings.length === 0) {
      throw new ApiError(404, 'Cliente no encontrado');
    }

    const totalSpent = client.bookings.reduce((sum, b) => {
      return sum + Number(b.service.priceFrom || 0);
    }, 0);

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        totalVisits: client.bookings.length,
        lastVisit: client.bookings[0]?.startTime || null,
        lastService: client.bookings[0]?.service.name || null,
        totalSpent,
        isFrequent: client.bookings.length >= 3,
        bookings: client.bookings.map((b) => ({
          id: b.id,
          serviceName: b.service.name,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          price: Number(b.service.priceFrom || 0),
          duration: b.service.durationMinutes,
        })),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
