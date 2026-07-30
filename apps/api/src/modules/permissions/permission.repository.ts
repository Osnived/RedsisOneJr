import type { Permission } from '@redsis/contracts';

export interface PermissionRecord {
  id: string;
  code: Permission;
  module: string;
  description: string | null;
}

/** Contrato de acceso al catálogo de permisos. */
export abstract class PermissionRepository {
  abstract list(): Promise<PermissionRecord[]>;
}
