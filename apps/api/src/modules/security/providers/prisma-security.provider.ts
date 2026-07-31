import { Injectable } from '@nestjs/common';
import {
  ALL_APP_MODULES,
  ALL_PERMISSIONS,
  isAppModule,
  isPermission,
  type AppModule,
  type Permission,
  type RoleAccessAuditEntry,
  type RoleSummary,
} from '@redsis/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SecurityRepository } from '../security.repository';
import type {
  CreateRoleData,
  RoleAccessChange,
  RoleAccessState,
  UpdateRoleData,
} from '../security.types';

const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  isActive: true,
  hasFullAccess: true,
  modules: { select: { module: true } },
  permissions: { select: { permission: { select: { code: true } } } },
  _count: { select: { users: true } },
} as const;

type PrismaRole = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  hasFullAccess: boolean;
  modules: { module: string }[];
  permissions: { permission: { code: string } }[];
  _count: { users: number };
};

@Injectable()
export class PrismaSecurityProvider extends SecurityRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listRoles(): Promise<RoleSummary[]> {
    const roles = await this.prisma.role.findMany({
      select: ROLE_SELECT,
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => toRole(role));
  }

  async findRoleById(id: string): Promise<RoleSummary | null> {
    const role = await this.prisma.role.findUnique({ where: { id }, select: ROLE_SELECT });

    return role ? toRole(role) : null;
  }

  async findRoleByName(name: string): Promise<RoleSummary | null> {
    const role = await this.prisma.role.findUnique({ where: { name }, select: ROLE_SELECT });

    return role ? toRole(role) : null;
  }

  async createRole(data: CreateRoleData): Promise<RoleSummary> {
    const role = await this.prisma.role.create({
      data: { name: data.name, description: data.description },
      select: ROLE_SELECT,
    });

    return toRole(role);
  }

  async updateRole(id: string, data: UpdateRoleData): Promise<RoleSummary> {
    const role = await this.prisma.role.update({
      where: { id },
      data,
      select: ROLE_SELECT,
    });

    return toRole(role);
  }

  async findRoleAccess(id: string): Promise<RoleAccessState | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        modules: { select: { module: true } },
        permissions: { select: { permission: { select: { code: true } } } },
      },
    });

    if (!role) {
      return null;
    }

    return {
      modules: toModules(role.modules),
      permissions: toPermissions(role.permissions),
    };
  }

  /**
   * Guardar los accesos y dejar rastro del cambio ocurre en una sola
   * transacción: un cambio de permisos sin auditoría es exactamente lo que este
   * módulo existe para evitar.
   */
  async replaceRoleAccess(change: RoleAccessChange): Promise<RoleSummary> {
    const permissionIds = await this.resolvePermissionIds(change.next.permissions);

    const role = await this.prisma.$transaction(async (transaction) => {
      await transaction.roleModule.deleteMany({ where: { roleId: change.roleId } });
      await transaction.roleModule.createMany({
        data: change.next.modules.map((module) => ({ roleId: change.roleId, module })),
      });

      await transaction.rolePermission.deleteMany({ where: { roleId: change.roleId } });
      await transaction.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: change.roleId, permissionId })),
      });

      await transaction.roleAccessAudit.create({
        data: {
          roleId: change.roleId,
          userId: change.userId,
          reason: change.reason,
          previousModules: change.previous.modules,
          newModules: change.next.modules,
          previousPermissions: change.previous.permissions,
          newPermissions: change.next.permissions,
        },
      });

      return transaction.role.findUniqueOrThrow({
        where: { id: change.roleId },
        select: ROLE_SELECT,
      });
    });

    return toRole(role);
  }

  async listAccessAudit(roleId: string): Promise<RoleAccessAuditEntry[]> {
    const entries = await this.prisma.roleAccessAudit.findMany({
      where: { roleId },
      orderBy: { occurredAt: 'desc' },
      select: {
        id: true,
        roleId: true,
        userId: true,
        reason: true,
        previousModules: true,
        newModules: true,
        previousPermissions: true,
        newPermissions: true,
        occurredAt: true,
        role: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      roleId: entry.roleId,
      roleName: entry.role.name,
      userId: entry.userId,
      userName: entry.user?.fullName ?? null,
      reason: entry.reason,
      previousModules: entry.previousModules,
      newModules: entry.newModules,
      previousPermissions: entry.previousPermissions,
      newPermissions: entry.newPermissions,
      occurredAt: entry.occurredAt.toISOString(),
    }));
  }

  /**
   * Traduce códigos de permiso a identificadores.
   *
   * Un código que no esté en la tabla se descarta en lugar de hacer fallar el
   * guardado completo: el catálogo del código y el de la base de datos pueden ir
   * desacompasados durante un despliegue.
   */
  private async resolvePermissionIds(permissions: Permission[]): Promise<string[]> {
    if (permissions.length === 0) {
      return [];
    }

    const stored = await this.prisma.permission.findMany({
      where: { code: { in: permissions } },
      select: { id: true },
    });

    return stored.map((permission) => permission.id);
  }
}

function toRole(role: PrismaRole): RoleSummary {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive,
    hasFullAccess: role.hasFullAccess,
    // Un rol de acceso total entrega el catálogo completo en lugar de lo
    // almacenado: así un módulo nuevo lo tiene desde que existe, sin migrar
    // datos ni depender de que alguien se acuerde de marcarlo.
    modules: role.hasFullAccess ? [...ALL_APP_MODULES] : toModules(role.modules),
    permissions: role.hasFullAccess ? [...ALL_PERMISSIONS] : toPermissions(role.permissions),
    userCount: role._count.users,
  };
}

/**
 * Se descarta lo que ya no existe en el catálogo.
 *
 * Un módulo retirado del código puede seguir almacenado; entregarlo obligaría a
 * cada consumidor a defenderse de un valor que el tipo dice que no existe.
 */
function toModules(rows: { module: string }[]): AppModule[] {
  return rows
    .map((row) => row.module)
    .filter(isAppModule)
    .sort();
}

function toPermissions(rows: { permission: { code: string } }[]): Permission[] {
  return rows
    .map((row) => row.permission.code)
    .filter(isPermission)
    .sort();
}
