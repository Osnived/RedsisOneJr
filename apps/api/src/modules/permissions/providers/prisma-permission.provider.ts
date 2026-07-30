import { Injectable } from '@nestjs/common';
import type { Permission } from '@redsis/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PermissionRepository, type PermissionRecord } from '../permission.repository';

@Injectable()
export class PrismaPermissionProvider extends PermissionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<PermissionRecord[]> {
    const permissions = await this.prisma.permission.findMany({
      select: { id: true, code: true, module: true, description: true },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    return permissions.map((permission) => ({
      ...permission,
      code: permission.code as Permission,
    }));
  }
}
