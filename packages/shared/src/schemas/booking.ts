import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().uuid('ID de servicio invalido'),
  slug: z.string().min(1, 'El slug del proveedor es requerido'),
  startTime: z.string().datetime('Fecha y hora invalida'),
  clientName: z.string().min(1, 'Tu nombre es requerido').max(100),
  clientEmail: z.string().email('Correo electronico invalido'),
  clientPhone: z.string().max(20).optional().or(z.literal('')),
});

export const rescheduleBookingSchema = z.object({
  newStartTime: z.string().datetime('Fecha y hora invalida'),
});

export const bookingStatusEnum = z.enum(['CONFIRMED', 'CANCELLED', 'RESCHEDULED']);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type BookingStatus = z.infer<typeof bookingStatusEnum>;
