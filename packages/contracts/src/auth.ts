import { z } from 'zod';
import { passwordSchema } from './password.js';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio')
    .email('Correo inválido')
    .toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es obligatorio'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Debe confirmar la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Contenido del access token. `sub` es el id del usuario. */
export interface JwtPayload {
  sub: string;
  email: string;
  permissions: string[];
  roles: string[];
}

/** Par de tokens devuelto por login y refresh. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Usuario autenticado tal como lo consume el frontend. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
