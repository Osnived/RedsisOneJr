export interface ActivityLogEntry {
  userId?: string | null;
  action: string;
  module: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export interface ActivityLogRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  module: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  occurredAt: Date;
}

export interface ListActivityLogOptions {
  skip: number;
  take: number;
}
