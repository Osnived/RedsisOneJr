import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PermissionSummary } from '@redsis/contracts';
import { permissionsApi } from './permissions.api';

export const permissionsQueryKeys = {
  all: ['permissions'] as const,
  list: () => ['permissions', 'list'] as const,
};

export function usePermissionCatalog(): UseQueryResult<PermissionSummary[], Error> {
  return useQuery({
    queryKey: permissionsQueryKeys.list(),
    queryFn: () => permissionsApi.list(),
    // El catálogo cambia con un despliegue, no durante la sesión.
    staleTime: 5 * 60 * 1000,
  });
}
