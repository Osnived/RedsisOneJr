import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AccessCatalog, RoleAccessAuditEntry, RoleSummary } from '@redsis/contracts';
import { securityApi } from './security.api';

export const securityQueryKeys = {
  all: ['security'] as const,
  roles: () => [...securityQueryKeys.all, 'roles'] as const,
  catalog: () => [...securityQueryKeys.all, 'catalog'] as const,
  audit: (roleId: string) => [...securityQueryKeys.all, 'audit', roleId] as const,
};

export function useRoles(): UseQueryResult<RoleSummary[], Error> {
  return useQuery({ queryKey: securityQueryKeys.roles(), queryFn: () => securityApi.listRoles() });
}

/**
 * Catálogo de módulos y permisos.
 *
 * Cambia solo con un despliegue, así que se conserva mucho más tiempo que los
 * roles: no tiene sentido volver a pedirlo al cambiar de rol seleccionado.
 */
export function useAccessCatalog(): UseQueryResult<AccessCatalog, Error> {
  return useQuery({
    queryKey: securityQueryKeys.catalog(),
    queryFn: () => securityApi.catalog(),
    staleTime: Infinity,
  });
}

/**
 * Historial de un rol.
 *
 * Se consulta por rol y no completo porque el panel inferior solo muestra el del
 * rol seleccionado, y traer el resto sería pedir datos que nadie va a ver.
 */
export function useRoleAudit(roleId: string | null): UseQueryResult<RoleAccessAuditEntry[], Error> {
  return useQuery({
    queryKey: securityQueryKeys.audit(roleId ?? 'ninguno'),
    queryFn: () => securityApi.listAudit(roleId ?? ''),
    enabled: roleId !== null,
  });
}
