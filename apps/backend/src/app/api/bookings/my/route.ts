import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);

    // Get user's email to match bookings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const now = new Date();

    // Fetch all bookings for this user's email
    const bookings = await prisma.booking.findMany({
      where: { clientEmail: user.email },
      include: {
        service: {
          select: { name: true, durationMinutes: true, priceFrom: true },
        },
        workspace: {
          select: {
            profile: {
              select: {
                displayName: true,
                contactEmail: true,
                contactPhone: true,
              },
            },
          },
        },
        token: {
          select: { token: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Separate into upcoming and history
    const upcoming = bookings.filter(
      (b) => b.startTime > now && b.status === 'CONFIRMED'
    );
    const history = bookings.filter(
      (b) => b.startTime <= now || b.status !== 'CONFIRMED'
    );

    return NextResponse.json({ upcoming, history });
  } catch (error) {
    return handleError(error);
  }
}
