import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/wompi';

// Map Wompi transaction status to our PaymentStatus
function mapWompiStatus(wompiStatus: string): 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' {
  switch (wompiStatus) {
    case 'APPROVED':
      return 'APPROVED';
    case 'DECLINED':
      return 'DECLINED';
    case 'VOIDED':
      return 'VOIDED';
    case 'ERROR':
      return 'ERROR';
    default:
      return 'PENDING';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature
    const checksum = body.signature?.checksum;
    if (!checksum) {
      return NextResponse.json({ error: 'Firma requerida' }, { status: 401 });
    }

    const isValid = verifyWebhookSignature(body, checksum);
    if (!isValid) {
      return NextResponse.json({ error: 'Firma invalida' }, { status: 401 });
    }

    // Process transaction.updated event
    if (body.event !== 'transaction.updated') {
      return NextResponse.json({ message: 'Evento ignorado' });
    }

    const transaction = body.data.transaction;
    const reference = transaction.reference;
    const transactionId = transaction.id;
    const status = mapWompiStatus(transaction.status);
    const paymentMethod = transaction.payment_method_type || null;

    // Find payment by reference
    const payment = await prisma.payment.findUnique({
      where: { wompiReference: reference },
    });

    if (!payment) {
      console.error(`Payment not found for reference: ${reference}`);
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        wompiTransactionId: transactionId,
        paymentMethod,
      },
    });

    // If approved, update booking payment status
    if (status === 'APPROVED') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: 'DEPOSIT_PAID' },
      });
    }

    return NextResponse.json({ message: 'Webhook procesado' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
  }
}
