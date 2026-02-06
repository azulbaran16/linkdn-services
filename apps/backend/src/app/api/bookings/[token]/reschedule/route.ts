import { NextRequest, NextResponse } from 'next/server';
import { rescheduleBookingSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { handleError, ApiError } from '@/lib/middleware';
import { sendEmail } from '@/lib/email';
import { bookingRescheduledEmail } from '@/lib/email-templates';
import { addMinutes, differenceInHours, isBefore } from 'date-fns';

const MIN_HOURS_BEFORE_RESCHEDULE = 6;

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const data = rescheduleBookingSchema.parse(body);

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

    // Enforce reschedule policy
    const hoursUntilBooking = differenceInHours(booking.startTime, new Date());
    if (hoursUntilBooking < MIN_HOURS_BEFORE_RESCHEDULE) {
      throw new ApiError(
        400,
        `No es posible reprogramar con menos de ${MIN_HOURS_BEFORE_RESCHEDULE} horas de anticipacion`
      );
    }

    const newStartTime = new Date(data.newStartTime);
    const newEndTime = addMinutes(newStartTime, booking.service.durationMinutes);

    // Validate new time is in the future
    if (isBefore(newStartTime, new Date())) {
      throw new ApiError(400, 'La nueva fecha seleccionada ya paso');
    }

    // Reschedule in a transaction with conflict check
    const updated = await prisma.$transaction(async (tx) => {
      const effectiveStart = addMinutes(newStartTime, -booking.service.bufferMinutesBefore);
      const effectiveEnd = addMinutes(newEndTime, booking.service.bufferMinutesAfter);

      const conflicting = await tx.booking.findFirst({
        where: {
          workspaceId: booking.workspaceId,
          status: 'CONFIRMED',
          id: { not: booking.id }, // Exclude current booking
          startTime: { lt: effectiveEnd },
          endTime: { gt: effectiveStart },
        },
      });

      if (conflicting) {
        throw new ApiError(409, 'El nuevo horario ya no esta disponible. Por favor selecciona otro.');
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          rescheduledAt: new Date(),
        },
      });
    });

    // Send reschedule email
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const manageUrl = `${APP_URL}/booking/manage/${params.token}`;
    const providerName = booking.workspace.profile?.displayName || booking.workspace.name;

    const emailData = bookingRescheduledEmail({
      clientName: booking.clientName,
      serviceName: booking.service.name,
      providerName,
      oldStartTime: booking.startTime,
      newStartTime,
      manageUrl,
    });

    sendEmail(booking.clientEmail, emailData.subject, emailData.html).catch((err) => {
      console.error('Failed to send reschedule email:', err);
    });

    return NextResponse.json({
      message: 'Reserva reprogramada exitosamente',
      booking: {
        id: updated.id,
        startTime: updated.startTime.toISOString(),
        endTime: updated.endTime.toISOString(),
        status: updated.status,
        rescheduledAt: updated.rescheduledAt?.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
