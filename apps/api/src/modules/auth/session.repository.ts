import type { CreateSessionData, SessionRecord } from './session.types';

/** Contrato de persistencia de sesiones (refresh tokens). */
export abstract class SessionRepository {
  abstract create(data: CreateSessionData): Promise<SessionRecord>;

  /** Busca una sesión vigente: ni revocada ni expirada. */
  abstract findActiveByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null>;

  abstract revokeById(id: string, revokedAt: Date): Promise<void>;

  abstract revokeAllForUser(userId: string, revokedAt: Date): Promise<number>;

  abstract deleteExpired(now: Date): Promise<number>;
}
