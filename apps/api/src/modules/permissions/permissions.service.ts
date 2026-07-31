import { Injectable } from '@nestjs/common';
import type { PermissionSummary } from '@redsis/contracts';
import { PermissionRepository } from './permission.repository';

export interface PermissionsByModule {
  module: string;
  permissions: PermissionSummary[];
}

/**
 * Expone el catálogo de permisos.
 *
 * Se ofrecen las dos formas a propósito: la lista plana la consume una tabla, y
 * la agrupada por módulo la consumirá la pantalla de asignación a roles. Agrupar
 * en el backend evita repetir esa lógica en cada cliente.
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly permissions: PermissionRepository) {}

  list(): Promise<PermissionSummary[]> {
    return this.permissions.list();
  }

  async listGroupedByModule(): Promise<PermissionsByModule[]> {
    const permissions = await this.permissions.list();
    const groups = new Map<string, PermissionSummary[]>();

    for (const permission of permissions) {
      const bucket = groups.get(permission.module);

      if (bucket) {
        bucket.push(permission);
      } else {
        groups.set(permission.module, [permission]);
      }
    }

    return [...groups.entries()].map(([module, items]) => ({ module, permissions: items }));
  }
}
