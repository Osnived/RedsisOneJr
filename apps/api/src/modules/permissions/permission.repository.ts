import type { PermissionSummary } from '@redsis/contracts';

/** Contrato de acceso al catálogo de permisos. */
export abstract class PermissionRepository {
  abstract list(): Promise<PermissionSummary[]>;
}
