import type { PaginatedResult, UserSummary } from '@redsis/contracts';
import { apiClient } from '@/lib/api-client';

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
};
