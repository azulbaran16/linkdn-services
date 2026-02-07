import { z } from 'zod';

// Slug: lowercase letters, numbers, hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const upsertProfileSchema = z.object({
  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(60)
    .regex(slugRegex, 'Solo letras minusculas, numeros y guiones'),
  displayName: z.string().min(1, 'El nombre es requerido').max(100),
  city: z.string().min(1, 'La ciudad es requerida').max(100),
  description: z.string().max(1000).optional().default(''),
  categoryIds: z.array(z.string().uuid()).min(1, 'Selecciona al menos una categoria'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  portfolioLinks: z.array(z.string().url()).optional().default([]),
  logoUrl: z.string().max(500000).optional().or(z.literal('')),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
