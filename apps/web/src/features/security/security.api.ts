import type {
  AccessCatalog,
  CreateRoleInput,
  RoleAccessAuditEntry,
  RoleSummary,
  UpdateRoleAccessInput,
  UpdateRoleInput,
} from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';

/**
 * Servicio de datos del módulo Seguridad.
 *
 * Todo pasa por `/security`: es el único sitio del backend que escribe accesos.
 * La pantalla no compone rutas ni conoce el formato de la respuesta más allá de
 * los contratos compartidos.
 */
export const securityApi = {
  catalog: (): Promise<AccessCatalog> => apiClient.get<AccessCatalog>('/security/catalog'),

  listRoles: (): Promise<RoleSummary[]> => apiClient.get<RoleSummary[]>('/security/roles'),

  createRole: (input: CreateRoleInput): Promise<RoleSummary> =>
    apiClient.post<RoleSummary>('/security/roles', input),

  updateRole: (id: string, input: UpdateRoleInput): Promise<RoleSummary> =>
    apiClient.patch<RoleSummary>(`/security/roles/${id}`, input),

  /**
   * Activar y desactivar son la misma operación con distinto valor. Los roles no
   * se eliminan: se desactivan, y conservan su configuración.
   */
  setRoleActive: (id: string, isActive: boolean): Promise<RoleSummary> =>
    apiClient.patch<RoleSummary>(`/security/roles/${id}`, { isActive }),

  /** Reemplaza módulos y permisos. El motivo viaja con el cambio, no aparte. */
  updateRoleAccess: (id: string, input: UpdateRoleAccessInput): Promise<RoleSummary> =>
    apiClient.patch<RoleSummary>(`/security/roles/${id}/access`, input),

  listAudit: (roleId: string): Promise<RoleAccessAuditEntry[]> =>
    apiClient.get<RoleAccessAuditEntry[]>(`/security/roles/${roleId}/audit`),
};
