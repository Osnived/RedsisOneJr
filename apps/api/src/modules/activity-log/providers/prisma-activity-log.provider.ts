import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ActivityLogRepository } from '../activity-log.repository';
import type {
  ActivityLogEntry,
  ActivityLogRecord,
  ListActivityLogOptions,
} from '../activity-log.types';

@Injectable()
export class PrismaActivityLogProvider extends ActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async append(entry: ActivityLogEntry): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        module: entry.module,
        entityId: entry.entityId ?? null,
        // El metadato es libre por diseño: cada módulo decide qué contexto añadir.
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }

  async list(
    options: ListActivityLogOptions,
  ): Promise<{ items: ActivityLogRecord[]; total: number }> {
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        select: {
          id: true,
          userId: true,
          action: true,
          module: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          occurredAt: true,
          user: { select: { email: true } },
        },
        orderBy: { occurredAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.activityLog.count(),
    ]);

    const items = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email ?? null,
      action: log.action,
      module: log.module,
      entityId: log.entityId,
      metadata: (log.metadata as Record<string, unknown> | null) ?? null,
      ipAddress: log.ipAddress,
      occurredAt: log.occurredAt,
    }));

    return { items, total };
  }
}
