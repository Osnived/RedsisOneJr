import type { AuthenticatedUser, LoginInput, LoginResponse } from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';

/**
 * Servicios de datos del módulo de autenticación.
 *
 * Los componentes nunca llaman al cliente HTTP directamente: consumen estos
 * servicios a través de TanStack Query.
 */
export const authApi = {
  login: (input: LoginInput): Promise<LoginResponse> =>
    apiClient.anonymousPost<LoginResponse>('/auth/login', input),

  logout: (refreshToken: string): Promise<void> =>
    apiClient.post<void>('/auth/logout', { refreshToken }),

  me: (): Promise<AuthenticatedUser> => apiClient.get<AuthenticatedUser>('/auth/me'),
};
