import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SessionRepository } from '../session.repository';
import type { CreateSessionData, SessionRecord } from '../session.types';

const SESSION_SELECT = {
  id: true,
  userId: true,
  expiresAt: true,
  revokedAt: true,
} as const;

@Injectable()
export class PrismaSessionProvider extends SessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateSessionData): Promise<SessionRecord> {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
      },
      select: SESSION_SELECT,
    });
  }

  async findActiveByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null> {
    return this.prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: SESSION_SELECT,
    });
  }

  async revokeById(id: string, revokedAt: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt },
    });
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });

    return result.count;
  }

  async deleteExpired(now: Date): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    return result.count;
  }
}
