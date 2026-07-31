import type {
  CreateUserInput,
  PaginatedResult,
  UpdateUserInput,
  UserSummary,
} from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';

/**
 * Servicio de datos del módulo de Usuarios.
 *
 * Vive en su propio módulo y no dentro de autenticación: consultar usuarios y
 * autenticarse son procesos distintos, y mezclarlos obligaba a las pantallas de
 * Usuarios a importar desde `features/auth`.
 */
export const usersApi = {
  list: (page: number, pageSize: number): Promise<PaginatedResult<UserSummary>> =>
    apiClient.get<PaginatedResult<UserSummary>>(`/users?page=${page}&pageSize=${pageSize}`),

  create: (input: CreateUserInput): Promise<UserSummary> =>
    apiClient.post<UserSummary>('/users', input),

  update: (id: string, input: UpdateUserInput): Promise<UserSummary> =>
    apiClient.patch<UserSummary>(`/users/${id}`, input),

  /**
   * Activar y suspender son la misma operación con distinto valor.
   *
   * Se usa PATCH y no DELETE aunque el backend también desactive con DELETE:
   * PATCH describe lo que ocurre —un cambio de estado reversible— y permite
   * volver a activar con la misma llamada.
   */
  setActive: (id: string, isActive: boolean): Promise<UserSummary> =>
    apiClient.patch<UserSummary>(`/users/${id}`, { isActive }),
};
