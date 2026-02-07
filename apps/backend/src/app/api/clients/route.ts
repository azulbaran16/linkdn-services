import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, getWorkspace, handleError } from '@/lib/middleware';

// GET /api/clients - List clients for the current provider's workspace
export async function GET(req: NextRequest) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'lastVisit';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Find all client profiles that have booked with this workspace
    const clients = await prisma.clientProfile.findMany({
      where: {
        bookings: {
          some: {
            workspaceId: workspace.id,
          },
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        bookings: {
          where: { workspaceId: workspace.id },
          orderBy: { startTime: 'desc' },
          include: {
            service: { select: { name: true, priceFrom: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const clientsWithStats = clients.map((client) => {
      const confirmedBookings = client.bookings.filter((b) => b.status === 'CONFIRMED');
      const totalSpent = client.bookings.reduce((sum, b) => {
        return sum + Number(b.service.priceFrom || 0);
      }, 0);

      return {
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
          status: b.status,
          price: Number(b.service.priceFrom || 0),
        })),
      };
    });

    // Sort
    if (sort === 'lastVisit') {
      clientsWithStats.sort((a, b) => {
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      });
    } else if (sort === 'frequent') {
      clientsWithStats.sort((a, b) => b.totalVisits - a.totalVisits);
    } else if (sort === 'name') {
      clientsWithStats.sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({ clients: clientsWithStats });
  } catch (error) {
    return handleError(error);
  }
}
