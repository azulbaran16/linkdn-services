import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError, ApiError } from '@/lib/middleware';
import { sendEmail } from '@/lib/email';
import { bookingCancelledEmail } from '@/lib/email-templates';
import { differenceInHours } from 'date-fns';

// Minimum hours before booking start to allow cancellation
const MIN_HOURS_BEFORE_CANCEL = 6;

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const bookingToken = await prisma.bookingToken.findUnique({
      where: { token: params.token },
      include: {
        booking: {
          include: {
            service: true,
            workspace: { include: { profile: true } },
          },
        },
      },
    });

    if (!bookingToken) {
      throw new ApiError(404, 'Enlace invalido o expirado');
    }

    const { booking } = bookingToken;

    if (booking.status !== 'CONFIRMED') {
      throw new ApiError(400, 'Esta reserva ya fue cancelada o modificada');
    }

    // Enforce cancellation policy
    const hoursUntilBooking = differenceInHours(booking.startTime, new Date());
    if (hoursUntilBooking < MIN_HOURS_BEFORE_CANCEL) {
      throw new ApiError(
        400,
        `No es posible cancelar con menos de ${MIN_HOURS_BEFORE_CANCEL} horas de anticipacion`
      );
    }

    // Cancel the booking
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Send cancellation email
    const providerName = booking.workspace.profile?.displayName || booking.workspace.name;
    const emailData = bookingCancelledEmail({
      clientName: booking.clientName,
      serviceName: booking.service.name,
      providerName,
      startTime: booking.startTime,
    });

    sendEmail(booking.clientEmail, emailData.subject, emailData.html).catch((err) => {
      console.error('Failed to send cancellation email:', err);
    });

    return NextResponse.json({
      message: 'Reserva cancelada exitosamente',
      booking: {
        id: updated.id,
        status: updated.status,
        cancelledAt: updated.cancelledAt?.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
