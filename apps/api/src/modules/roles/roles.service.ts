import { Injectable, NotFoundException } from '@nestjs/common';
import type { RoleSummary } from '@redsis/contracts';
import { RoleRepository } from './role.repository';

/**
 * Consulta de roles. Los roles únicamente agrupan permisos: la autorización
 * efectiva siempre se evalúa sobre los permisos resultantes.
 */
@Injectable()
export class RolesService {
  constructor(private readonly roles: RoleRepository) {}

  list(): Promise<RoleSummary[]> {
    return this.roles.list();
  }

  async findById(id: string): Promise<RoleSummary> {
    const role = await this.roles.findById(id);

    if (!role) {
      throw new NotFoundException(`No existe el rol ${id}`);
    }

    return role;
  }
}
