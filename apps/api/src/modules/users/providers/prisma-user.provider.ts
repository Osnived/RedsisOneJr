import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ALL_APP_MODULES,
  ALL_PERMISSIONS,
  isAppModule,
  type AppModule,
  type Permission,
} from '@redsis/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UserRepository } from '../user.repository';
import type {
  CreateUserData,
  ListUsersOptions,
  UpdateUserData,
  UserAccount,
  UserWithAccess,
  UserWithCredentials,
} from '../user.types';

/** Forma exacta que se solicita a Prisma para poder mapear roles y permisos. */
const USER_WITH_ACCESS_SELECT = {
  id: true,
  email: true,
  fullName: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  passwordHash: true,
  roles: {
    // Solo los roles activos otorgan acceso: desactivar un rol debe retirar lo
    // que concede sin tener que quitárselo a cada usuario.
    where: { role: { isActive: true } },
    select: {
      roleId: true,
      role: {
        select: {
          name: true,
          hasFullAccess: true,
          modules: { select: { module: true } },
          permissions: { select: { permission: { select: { code: true } } } },
        },
      },
    },
  },
} as const;

type PrismaUserWithAccess = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  passwordHash: string;
  roles: {
    roleId: string;
    role: {
      name: string;
      hasFullAccess: boolean;
      modules: { module: string }[];
      permissions: { permission: { code: string } }[];
    };
  }[];
};

/**
 * Implementación PostgreSQL del contrato `UserRepository`.
 *
 * Es la única capa que conoce Prisma para la entidad Usuario. Sustituir el
 * origen de datos implica escribir otro Provider, sin tocar servicios ni frontend.
 */
@Injectable()
export class PrismaUserProvider extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByEmail(email: string): Promise<UserWithCredentials | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: USER_WITH_ACCESS_SELECT,
    });

    return user ? this.toUserWithCredentials(user) : null;
  }

  async findById(id: string): Promise<UserWithAccess | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_WITH_ACCESS_SELECT,
    });

    return user ? this.toUserWithAccess(user) : null;
  }

  async findByIdWithCredentials(id: string): Promise<UserWithCredentials | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_WITH_ACCESS_SELECT,
    });

    return user ? this.toUserWithCredentials(user) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }

  async list(options: ListUsersOptions): Promise<{ items: UserWithAccess[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: USER_WITH_ACCESS_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.user.count(),
    ]);

    return { items: users.map((user) => this.toUserWithAccess(user)), total };
  }

  async create(data: CreateUserData): Promise<UserWithAccess> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        passwordHash: data.passwordHash,
        roles: {
          create: data.roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: USER_WITH_ACCESS_SELECT,
    });

    return this.toUserWithAccess(user);
  }

  /**
   * Los roles se reemplazan por completo cuando se envían: es la semántica que
   * espera un formulario de edición, y evita estados intermedios inconsistentes.
   */
  async update(id: string, data: UpdateUserData): Promise<UserWithAccess> {
    await this.assertExists(id);

    const user = await this.prisma.$transaction(async (tx) => {
      if (data.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (data.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: data.roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          ...(data.fullName === undefined ? {} : { fullName: data.fullName }),
          ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
        },
        select: USER_WITH_ACCESS_SELECT,
      });
    });

    return this.toUserWithAccess(user);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async registerLogin(id: string, occurredAt: Date): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: occurredAt } });
  }

  /**
   * Los usuarios se desactivan, no se eliminan: el historial de actividad debe
   * seguir siendo trazable (ver PROJECT_CONTEXT.md).
   */
  async deactivate(id: string): Promise<UserAccount> {
    await this.assertExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_WITH_ACCESS_SELECT,
    });

    return this.toUserAccount(user);
  }

  private async assertExists(id: string): Promise<void> {
    const count = await this.prisma.user.count({ where: { id } });

    if (count === 0) {
      throw new NotFoundException(`No existe el usuario ${id}`);
    }
  }

  private toUserAccount(user: PrismaUserWithAccess): UserAccount {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private toUserWithAccess(user: PrismaUserWithAccess): UserWithAccess {
    return {
      ...this.toUserAccount(user),
      roles: user.roles.map((entry) => entry.role.name),
      roleIds: user.roles.map((entry) => entry.roleId),
      modules: this.collectModules(user),
      permissions: this.collectPermissions(user),
    };
  }

  private toUserWithCredentials(user: PrismaUserWithAccess): UserWithCredentials {
    return { ...this.toUserWithAccess(user), passwordHash: user.passwordHash };
  }

  /**
   * Módulos a los que llega el usuario por sus roles.
   *
   * Con varios roles los accesos se acumulan. Es el único cálculo del acceso
   * efectivo a módulos, y por eso es el sitio donde entrarían la herencia, la
   * vigencia o el alcance cuando se implementen.
   */
  private collectModules(user: PrismaUserWithAccess): AppModule[] {
    if (hasFullAccess(user)) {
      return [...ALL_APP_MODULES];
    }

    const modules = new Set<string>();

    for (const { role } of user.roles) {
      for (const { module } of role.modules) {
        modules.add(module);
      }
    }

    return [...modules].filter(isAppModule).sort();
  }

  /** Un permiso puede llegar por varios roles; se devuelve sin duplicados. */
  private collectPermissions(user: PrismaUserWithAccess): Permission[] {
    if (hasFullAccess(user)) {
      return [...ALL_PERMISSIONS];
    }

    const codes = new Set<string>();

    for (const { role } of user.roles) {
      for (const { permission } of role.permissions) {
        codes.add(permission.code);
      }
    }

    return [...codes].sort() as Permission[];
  }
}

/**
 * Si alguno de los roles activos del usuario concede acceso total.
 *
 * Cuando lo hay se entrega el catálogo completo sin mirar lo almacenado: es lo
 * que garantiza que quien administra la plataforma no se quede fuera por una
 * configuración incompleta, y que un módulo nuevo lo tenga desde que existe.
 */
function hasFullAccess(user: PrismaUserWithAccess): boolean {
  return user.roles.some((entry) => entry.role.hasFullAccess);
}
