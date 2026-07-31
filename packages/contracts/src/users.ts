import { z } from 'zod';
import { passwordSchema } from './password.js';

export const createUserSchema = z.object({
  email: z.string().trim().email('Correo inválido').toLowerCase(),
  fullName: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  password: passwordSchema,
  roleIds: z.array(z.string().uuid('Identificador de rol inválido')).default([]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
}
