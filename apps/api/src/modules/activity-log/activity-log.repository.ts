import type {
  ActivityLogEntry,
  ActivityLogRecord,
  ListActivityLogOptions,
} from './activity-log.types';

/** Contrato de persistencia del historial de actividad. */
export abstract class ActivityLogRepository {
  abstract append(entry: ActivityLogEntry): Promise<void>;

  abstract list(
    options: ListActivityLogOptions,
  ): Promise<{ items: ActivityLogRecord[]; total: number }>;
}
