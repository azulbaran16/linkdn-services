import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, ApiError } from '@/lib/middleware';

// Get booking details by token (public, no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const bookingToken = await prisma.bookingToken.findUnique({
      where: { token: params.token },
      include: {
        booking: {
          include: {
            service: { select: { name: true, durationMinutes: true } },
            workspace: {
              include: {
                profile: { select: { displayName: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!bookingToken) {
      throw new ApiError(404, 'Enlace invalido o expirado');
    }

    const { booking } = bookingToken;

    return NextResponse.json({
      booking: {
        id: booking.id,
        serviceName: booking.service.name,
        durationMinutes: booking.service.durationMinutes,
        providerName: booking.workspace.profile?.displayName || '',
        providerSlug: booking.workspace.profile?.slug || '',
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        cancelledAt: booking.cancelledAt?.toISOString() || null,
        rescheduledAt: booking.rescheduledAt?.toISOString() || null,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
