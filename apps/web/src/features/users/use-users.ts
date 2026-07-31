import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PaginatedResult, UserSummary } from '@redsis/contracts';
import { usersApi } from './users.api';

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (page: number, pageSize: number) => ['users', 'list', { page, pageSize }] as const,
};

/**
 * Consulta paginada de usuarios.
 *
 * Centraliza la clave de caché para que el panel y el listado compartan los
 * mismos datos cuando piden la misma página.
 */
export function useUsers(
  page: number,
  pageSize: number,
): UseQueryResult<PaginatedResult<UserSummary>, Error> {
  return useQuery({
    queryKey: usersQueryKeys.list(page, pageSize),
    queryFn: () => usersApi.list(page, pageSize),
  });
}
