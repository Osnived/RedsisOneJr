import { Injectable } from '@nestjs/common';
import type { RoleSummary } from '@redsis/contracts';
import { SecurityService } from '../security/security.service';

/**
 * Consulta de roles para el resto de la plataforma.
 *
 * Existe para que asignar un rol a un usuario no exija acceso al módulo
 * Seguridad: quien administra usuarios necesita ver los nombres de los roles,
 * no administrarlos.
 *
 * No consulta la base de datos por su cuenta: delega en Seguridad, que es la
 * única fuente de verdad sobre los accesos. Así no existen dos formas de leer un
 * rol que puedan divergir.
 */
@Injectable()
export class RolesService {
  constructor(private readonly security: SecurityService) {}

  list(): Promise<RoleSummary[]> {
    return this.security.listRoles();
  }

  findById(id: string): Promise<RoleSummary> {
    return this.security.findRoleById(id);
  }
}
