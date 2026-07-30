import { Injectable, Logger } from '@nestjs/common';
import {
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationInput,
} from '@redsis/contracts';
import { ActivityLogRepository } from './activity-log.repository';
import type { ActivityLogEntry, ActivityLogRecord } from './activity-log.types';

export interface ActivityLogView {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  module: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  occurredAt: string;
}

/**
 * Registra las acciones relevantes de la plataforma.
 *
 * Toda acción importante deja rastro (ver PROJECT_CONTEXT.md), pero un fallo
 * al escribir el historial nunca debe tumbar la operación que lo originó:
 * es preferible perder un registro que impedir un login o una edición válida.
 */
@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly repository: ActivityLogRepository) {}

  async record(entry: ActivityLogEntry): Promise<void> {
    try {
      await this.repository.append(entry);
    } catch (error) {
      this.logger.error(
        `No se pudo registrar la actividad ${entry.module}.${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async list(pagination: PaginationInput): Promise<PaginatedResult<ActivityLogView>> {
    const { items, total } = await this.repository.list({
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return buildPaginatedResult(items.map(toActivityLogView), total, pagination);
  }
}

function toActivityLogView(record: ActivityLogRecord): ActivityLogView {
  return { ...record, occurredAt: record.occurredAt.toISOString() };
}
