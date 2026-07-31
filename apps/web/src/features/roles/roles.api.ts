import type { RoleSummary } from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';

/** Servicio de datos del módulo de Roles. */
export const rolesApi = {
  list: (): Promise<RoleSummary[]> => apiClient.get<RoleSummary[]>('/roles'),
};
