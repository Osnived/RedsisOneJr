import type { PermissionSummary } from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';

/** Servicio de datos del catálogo de permisos. */
export const permissionsApi = {
  list: (): Promise<PermissionSummary[]> => apiClient.get<PermissionSummary[]>('/permissions'),
};
