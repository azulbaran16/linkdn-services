import { NextRequest, NextResponse } from 'next/server';
import { createBookingSchema } from 'shared';
import { prisma } from '@/lib/prisma';
import { handleError, ApiError } from '@/lib/middleware';
import { sendEmail } from '@/lib/email';
import { bookingConfirmationEmail } from '@/lib/email-templates';
import { randomUUID } from 'crypto';
import { addMinutes, isBefore, isAfter } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createBookingSchema.parse(body);

    // Find workspace by slug
    const profile = await prisma.providerProfile.findUnique({
      where: { slug: data.slug },
      select: { workspaceId: true, isPublished: true, displayName: true },
    });

    if (!profile || !profile.isPublished) {
      throw new ApiError(404, 'Proveedor no encontrado');
    }

    // Verify service belongs to workspace
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, workspaceId: profile.workspaceId, active: true },
    });
    if (!service) {
      throw new ApiError(404, 'Servicio no encontrado');
    }

    const startTime = new Date(data.startTime);
    const endTime = addMinutes(startTime, service.durationMinutes);

    // Validate start time is in the future
    if (isBefore(startTime, new Date())) {
      throw new ApiError(400, 'La fecha seleccionada ya paso');
    }

    // Create booking in a transaction with double-booking prevention
    const result = await prisma.$transaction(async (tx) => {
      // Check for conflicting bookings (considering buffers)
      const effectiveStart = addMinutes(startTime, -service.bufferMinutesBefore);
      const effectiveEnd = addMinutes(endTime, service.bufferMinutesAfter);

      const conflicting = await tx.booking.findFirst({
        where: {
          workspaceId: profile.workspaceId,
          status: 'CONFIRMED',
          // Any booking that overlaps with the effective range
          startTime: { lt: effectiveEnd },
          endTime: { gt: effectiveStart },
        },
      });

      if (conflicting) {
        throw new ApiError(409, 'Este horario ya no esta disponible. Por favor selecciona otro.');
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          serviceId: data.serviceId,
          workspaceId: profile.workspaceId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone || '',
          startTime,
          endTime,
          status: 'CONFIRMED',
        },
      });

      // Create manage token
      const token = randomUUID();
      await tx.bookingToken.create({
        data: {
          bookingId: booking.id,
          token,
          expiresAt: startTime, // Token valid until booking start
        },
      });

      return { booking, token };
    });

    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const manageUrl = `${APP_URL}/booking/manage/${result.token}`;

    // Send confirmation email (non-blocking)
    const emailData = bookingConfirmationEmail({
      clientName: data.clientName,
      serviceName: service.name,
      providerName: profile.displayName,
      startTime,
      endTime,
      manageUrl,
    });

    sendEmail(data.clientEmail, emailData.subject, emailData.html).catch((err) => {
      console.error('Failed to send booking confirmation email:', err);
    });

    return NextResponse.json({
      booking: {
        id: result.booking.id,
        serviceName: service.name,
        providerName: profile.displayName,
        startTime: result.booking.startTime.toISOString(),
        endTime: result.booking.endTime.toISOString(),
        status: result.booking.status,
        clientName: result.booking.clientName,
        clientEmail: result.booking.clientEmail,
      },
      manageToken: result.token,
      manageUrl,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos', details: error }, { status: 400 });
    }
    return handleError(error);
  }
}
