import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ACTIVITY_ACTIONS,
  MODULES,
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationInput,
  type UserSummary,
} from '@redsis/contracts';
import { PasswordService } from '../auth/password.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UserRepository } from './user.repository';
import type { CreateUserData, UserWithAccess } from './user.types';

interface ActorContext {
  actorId: string;
  ipAddress?: string;
}

/**
 * Reglas de negocio de usuarios. Toda la lógica vive aquí, nunca en el frontend.
 * El servicio depende del contrato `UserRepository`, no de Prisma.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async list(pagination: PaginationInput): Promise<PaginatedResult<UserSummary>> {
    const { items, total } = await this.users.list({
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return buildPaginatedResult(items.map(toUserSummary), total, pagination);
  }

  async findById(id: string): Promise<UserSummary> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new NotFoundException(`No existe el usuario ${id}`);
    }

    return toUserSummary(user);
  }

  async create(
    input: { email: string; fullName: string; password: string; roleIds: string[] },
    actor: ActorContext,
  ): Promise<UserSummary> {
    if (await this.users.existsByEmail(input.email)) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const data: CreateUserData = {
      email: input.email,
      fullName: input.fullName,
      passwordHash: await this.passwordService.hash(input.password),
      roleIds: input.roleIds,
    };

    const created = await this.users.create(data);

    await this.activityLog.record({
      userId: actor.actorId,
      action: ACTIVITY_ACTIONS.CREATE,
      module: MODULES.USERS,
      entityId: created.id,
      metadata: { email: created.email },
      ipAddress: actor.ipAddress,
    });

    return toUserSummary(created);
  }

  async update(
    id: string,
    input: { fullName?: string; isActive?: boolean; roleIds?: string[] },
    actor: ActorContext,
  ): Promise<UserSummary> {
    const updated = await this.users.update(id, input);

    await this.activityLog.record({
      userId: actor.actorId,
      action: ACTIVITY_ACTIONS.UPDATE,
      module: MODULES.USERS,
      entityId: id,
      metadata: { changes: Object.keys(input) },
      ipAddress: actor.ipAddress,
    });

    return toUserSummary(updated);
  }

  /**
   * Desactiva al usuario en lugar de eliminarlo, para no perder trazabilidad.
   * Un usuario no puede desactivarse a sí mismo: dejaría la cuenta inaccesible
   * sin que nadie más pueda revertirlo.
   */
  async deactivate(id: string, actor: ActorContext): Promise<{ id: string; isActive: boolean }> {
    if (id === actor.actorId) {
      throw new ConflictException('Un usuario no puede desactivar su propia cuenta');
    }

    const user = await this.users.deactivate(id);

    await this.activityLog.record({
      userId: actor.actorId,
      action: ACTIVITY_ACTIONS.DELETE,
      module: MODULES.USERS,
      entityId: id,
      ipAddress: actor.ipAddress,
    });

    return { id: user.id, isActive: user.isActive };
  }
}

function toUserSummary(user: UserWithAccess): UserSummary {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: user.roles,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}
