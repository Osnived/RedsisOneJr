import { Module } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLogService } from './activity-log.service';
import { PrismaActivityLogProvider } from './providers/prisma-activity-log.provider';

@Module({
  controllers: [ActivityLogController],
  providers: [
    ActivityLogService,
    { provide: ActivityLogRepository, useClass: PrismaActivityLogProvider },
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
