import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { HealthRepository } from '../health.repository';

@Injectable()
export class PrismaHealthProvider extends HealthRepository {
  private readonly logger = new Logger(PrismaHealthProvider.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      // El fallo se registra pero no se propaga: el endpoint de salud debe
      // responder siempre, informando el estado en lugar de caerse.
      this.logger.warn(
        `PostgreSQL no responde: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
