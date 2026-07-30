import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository, type RoleWithPermissions } from './role.repository';

/**
 * Consulta de roles. Los roles únicamente agrupan permisos: la autorización
 * efectiva siempre se evalúa sobre los permisos resultantes.
 */
@Injectable()
export class RolesService {
  constructor(private readonly roles: RoleRepository) {}

  list(): Promise<RoleWithPermissions[]> {
    return this.roles.list();
  }

  async findById(id: string): Promise<RoleWithPermissions> {
    const role = await this.roles.findById(id);

    if (!role) {
      throw new NotFoundException(`No existe el rol ${id}`);
    }

    return role;
  }
}
