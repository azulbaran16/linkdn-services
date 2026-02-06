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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
