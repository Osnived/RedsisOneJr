import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';
import { PrismaHealthProvider } from './providers/prisma-health.provider';

@Module({
  controllers: [HealthController],
  providers: [HealthService, { provide: HealthRepository, useClass: PrismaHealthProvider }],
})
export class HealthModule {}
