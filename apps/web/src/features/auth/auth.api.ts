import type {
  AuthenticatedUser,
  LoginInput,
  LoginResponse,
  PaginatedResult,
  UserSummary,
} from '@redsis/contracts';
import { apiClient } from '@/lib/api-client';

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

export const usersApi = {
  list: (page: number, pageSize: number): Promise<PaginatedResult<UserSummary>> =>
    apiClient.get<PaginatedResult<UserSummary>>(`/users?page=${page}&pageSize=${pageSize}`),
};
