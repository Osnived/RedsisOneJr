import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ACTIVITY_ACTIONS,
  APP_MODULES,
  isAppModule,
  isPermission,
  type AppModule,
  type CreateRoleInput,
  type RoleAccessAuditEntry,
  type RoleSummary,
  type UpdateRoleAccessInput,
  type UpdateRoleInput,
} from '@redsis/contracts';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { SecurityRepository } from './security.repository';

/**
 * Administración de accesos.
 *
 * Es la única fuente de verdad sobre qué puede hacer un rol. Ninguna otra parte
 * del backend escribe módulos ni permisos.
 *
 * Dos reglas protegen contra dejar la plataforma sin administradores, que es un
 * fallo del que no se puede salir desde la interfaz:
 *
 * - un rol del sistema no se puede desactivar;
 * - un rol del sistema no puede perder el acceso a Seguridad.
 *
 * Se aplican sobre `isSystem` y no sobre el nombre del rol: renombrar
 * "administrador" no debe desarmar la protección.
 */
@Injectable()
export class SecurityService {
  constructor(
    private readonly security: SecurityRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  listRoles(): Promise<RoleSummary[]> {
    return this.security.listRoles();
  }

  async findRoleById(id: string): Promise<RoleSummary> {
    const role = await this.security.findRoleById(id);

    if (!role) {
      throw new NotFoundException(`No existe el rol ${id}`);
    }

    return role;
  }

  async createRole(input: CreateRoleInput): Promise<RoleSummary> {
    const existing = await this.security.findRoleByName(input.name);

    if (existing) {
      throw new ConflictException(`Ya existe un rol llamado ${input.name}`);
    }

    return this.security.createRole({
      name: input.name,
      description: input.description ?? null,
    });
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<RoleSummary> {
    const role = await this.findRoleById(id);

    if (input.name !== undefined && input.name !== role.name) {
      const withSameName = await this.security.findRoleByName(input.name);

      if (withSameName) {
        throw new ConflictException(`Ya existe un rol llamado ${input.name}`);
      }
    }

    if (input.isActive === false && (role.isSystem || role.hasFullAccess)) {
      throw new ForbiddenException(
        'Un rol del sistema no se puede desactivar: dejaría la plataforma sin administración',
      );
    }

    return this.security.updateRole(id, {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    });
  }

  /**
   * Reemplaza los accesos de un rol dejando constancia del motivo.
   *
   * El motivo lo exige el contrato compartido, así que la validación ya ocurrió
   * antes de llegar aquí. Lo que se comprueba en este punto es lo que solo el
   * dominio sabe: que el cambio no deje la plataforma sin administración.
   */
  async updateRoleAccess(
    id: string,
    input: UpdateRoleAccessInput,
    userId: string,
  ): Promise<RoleSummary> {
    const role = await this.findRoleById(id);

    // El acceso de un rol total se calcula, no se almacena: editarlo no tendría
    // efecto, y dejar guardar un cambio que no cambia nada es peor que negarlo.
    if (role.hasFullAccess) {
      throw new ForbiddenException(
        `El rol ${role.name} tiene acceso total por definición: su acceso no se edita`,
      );
    }

    const previous = await this.security.findRoleAccess(id);

    if (!previous) {
      throw new NotFoundException(`No existe el rol ${id}`);
    }

    const modules = input.modules.filter(isAppModule);
    const permissions = input.permissions.filter(isPermission);

    this.assertKeepsSecurityAccess(role, modules);

    const updated = await this.security.replaceRoleAccess({
      roleId: id,
      userId,
      reason: input.reason,
      previous,
      next: { modules, permissions },
    });

    // La auditoría detallada ya quedó registrada dentro de la transacción. Esto
    // es el rastro transversal de la plataforma, que no conoce el antes ni el
    // después: solo que alguien tocó los accesos de este rol y por qué.
    await this.activityLog.record({
      userId,
      action: ACTIVITY_ACTIONS.UPDATE,
      module: APP_MODULES.SECURITY,
      entityId: id,
      metadata: { reason: input.reason },
    });

    return updated;
  }

  async listAccessAudit(roleId: string): Promise<RoleAccessAuditEntry[]> {
    // Se comprueba que el rol exista para no devolver una lista vacía que
    // parezca "sin cambios" cuando en realidad el identificador es incorrecto.
    await this.findRoleById(roleId);

    return this.security.listAccessAudit(roleId);
  }

  private assertKeepsSecurityAccess(role: RoleSummary, modules: AppModule[]): void {
    const keepsSecurity = modules.includes(APP_MODULES.SECURITY);

    if (role.isSystem && role.modules.includes(APP_MODULES.SECURITY) && !keepsSecurity) {
      throw new ForbiddenException(
        'Un rol del sistema no puede perder el acceso a Seguridad: nadie podría devolvérselo',
      );
    }
  }
}
