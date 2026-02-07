import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Get all bookings for this user, then their payments
    const bookings = await prisma.booking.findMany({
      where: { clientEmail: user.email },
      select: { id: true },
    });

    const bookingIds = bookings.map((b) => b.id);

    const payments = await prisma.payment.findMany({
      where: { bookingId: { in: bookingIds } },
      include: {
        booking: {
          select: {
            clientName: true,
            startTime: true,
            service: { select: { name: true } },
            workspace: {
              select: {
                profile: { select: { displayName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    return handleError(error);
  }
}
