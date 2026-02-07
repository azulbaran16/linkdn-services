import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional().default(''),
  durationMinutes: z.number().int().min(15, 'Duracion minima: 15 minutos').max(480),
  bufferMinutesBefore: z.number().int().min(0).max(120).optional().default(0),
  bufferMinutesAfter: z.number().int().min(0).max(120).optional().default(0),
  priceFrom: z.number().min(0).optional().nullable(),
  images: z.array(z.string().max(500000)).max(5).optional().default([]),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
