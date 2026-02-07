import crypto from 'crypto';

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY || '';
const WOMPI_ENV = process.env.WOMPI_ENV || 'sandbox';

const BASE_URL =
  WOMPI_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';

export interface CreateTransactionParams {
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string;
  redirectUrl: string;
}

export interface WompiTransaction {
  id: string;
  status: string;
  reference: string;
  payment_method_type: string;
}

/**
 * Get an acceptance token (required before creating a transaction)
 */
export async function getAcceptanceToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/merchants/${WOMPI_PUBLIC_KEY}`);
  if (!res.ok) {
    throw new Error('No se pudo obtener el token de aceptacion de Wompi');
  }
  const data = await res.json();
  return data.data.presigned_acceptance.acceptance_token;
}

/**
 * Create a payment link that redirects the user to Wompi's checkout
 */
export async function createPaymentLink(params: CreateTransactionParams): Promise<string> {
  // Generate integrity signature
  const integrityString = `${params.reference}${params.amountInCents}${params.currency}${WOMPI_PRIVATE_KEY}`;
  const integrityHash = crypto
    .createHash('sha256')
    .update(integrityString)
    .digest('hex');

  // Build Wompi checkout URL with parameters
  const checkoutUrl = new URL(`${BASE_URL.replace('/v1', '')}/checkout`);
  checkoutUrl.searchParams.set('public-key', WOMPI_PUBLIC_KEY);
  checkoutUrl.searchParams.set('currency', params.currency);
  checkoutUrl.searchParams.set('amount-in-cents', String(params.amountInCents));
  checkoutUrl.searchParams.set('reference', params.reference);
  checkoutUrl.searchParams.set('redirect-url', params.redirectUrl);
  checkoutUrl.searchParams.set('signature:integrity', integrityHash);

  return checkoutUrl.toString();
}

/**
 * Verify Wompi webhook signature
 */
export function verifyWebhookSignature(
  eventData: { event: string; data: { transaction: WompiTransaction }; timestamp: number },
  checksum: string
): boolean {
  if (!WOMPI_EVENTS_KEY) return false;

  const transaction = eventData.data.transaction;
  const signatureString = `${transaction.id}${transaction.status}${transaction.reference}${eventData.timestamp}${WOMPI_EVENTS_KEY}`;
  const expectedChecksum = crypto
    .createHash('sha256')
    .update(signatureString)
    .digest('hex');

  return expectedChecksum === checksum;
}

/**
 * Get transaction details from Wompi
 */
export async function getTransaction(transactionId: string): Promise<WompiTransaction> {
  const res = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error('No se pudo obtener la transaccion de Wompi');
  }
  const data = await res.json();
  return data.data;
}
