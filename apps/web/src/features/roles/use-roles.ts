import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { RoleSummary } from '@redsis/contracts';
import { rolesApi } from './roles.api';

export const rolesQueryKeys = {
  all: ['roles'] as const,
  list: () => ['roles', 'list'] as const,
};

export function useRoles(): UseQueryResult<RoleSummary[], Error> {
  return useQuery({
    queryKey: rolesQueryKeys.list(),
    queryFn: () => rolesApi.list(),
  });
}
