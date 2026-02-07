import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/middleware';
import { createPaymentLink } from '@/lib/wompi';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await withAuth(req);

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      throw new ApiError(400, 'bookingId es requerido');
    }

    // Get booking with service price
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { priceFrom: true, name: true } },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Reserva no encontrada');
    }

    if (!booking.service.priceFrom) {
      throw new ApiError(400, 'Este servicio no tiene precio definido');
    }

    if (booking.paymentStatus === 'DEPOSIT_PAID') {
      throw new ApiError(400, 'El deposito ya fue pagado');
    }

    // Calculate 30% deposit in COP centavos
    const totalPrice = Number(booking.service.priceFrom);
    const depositAmount = Math.round(totalPrice * 0.3);
    const amountInCents = depositAmount * 100; // COP centavos

    // Generate unique reference
    const reference = `LDN-${booking.id.slice(0, 8)}-${crypto.randomBytes(4).toString('hex')}`;

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/api/payments/redirect?ref=${reference}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amountInCents,
        currency: 'COP',
        status: 'PENDING',
        wompiReference: reference,
      },
    });

    // Update booking payment status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: 'PENDING_PAYMENT' },
    });

    // Create Wompi payment link (or sandbox auto-approve if no keys)
    let paymentUrl: string;
    const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY;

    if (wompiPublicKey) {
      paymentUrl = await createPaymentLink({
        amountInCents,
        currency: 'COP',
        reference,
        customerEmail: booking.clientEmail,
        redirectUrl,
      });
    } else {
      // Dev/sandbox mode: auto-approve payment instantly
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'APPROVED', paymentMethod: 'SANDBOX' },
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: 'DEPOSIT_PAID' },
      });
      paymentUrl = '__SANDBOX_APPROVED__';
    }

    return NextResponse.json({
      paymentUrl,
      reference,
      amount: depositAmount,
      amountInCents,
      paymentId: payment.id,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Formato de solicitud invalido' }, { status: 400 });
    }
    return handleError(error);
  }
}
