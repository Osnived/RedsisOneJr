import { Injectable } from '@nestjs/common';
import type { Permission } from '@redsis/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RoleRepository, type RoleWithPermissions } from '../role.repository';

const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  permissions: { select: { permission: { select: { code: true } } } },
  _count: { select: { users: true } },
} as const;

type PrismaRole = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { code: string } }[];
  _count: { users: number };
};

@Injectable()
export class PrismaRoleProvider extends RoleRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      select: ROLE_SELECT,
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => this.toRole(role));
  }

  async findById(id: string): Promise<RoleWithPermissions | null> {
    const role = await this.prisma.role.findUnique({ where: { id }, select: ROLE_SELECT });

    return role ? this.toRole(role) : null;
  }

  private toRole(role: PrismaRole): RoleWithPermissions {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((entry) => entry.permission.code).sort() as Permission[],
      userCount: role._count.users,
    };
  }
}
