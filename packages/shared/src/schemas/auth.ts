import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
});

export const socialLoginSchema = z.object({
  provider: z.enum(['GOOGLE', 'APPLE']),
  idToken: z.string().min(1, 'Token es requerido'),
  name: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100).optional(),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
