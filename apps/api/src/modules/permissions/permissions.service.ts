import { Injectable } from '@nestjs/common';
import { PermissionRepository, type PermissionRecord } from './permission.repository';

export interface PermissionsByModule {
  module: string;
  permissions: PermissionRecord[];
}

/**
 * Expone el catálogo de permisos.
 *
 * Se entrega agrupado por módulo porque así lo consume la pantalla de roles:
 * agrupar en el backend evita repetir esa lógica en cada cliente.
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly permissions: PermissionRepository) {}

  list(): Promise<PermissionRecord[]> {
    return this.permissions.list();
  }

  async listGroupedByModule(): Promise<PermissionsByModule[]> {
    const permissions = await this.permissions.list();
    const groups = new Map<string, PermissionRecord[]>();

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
