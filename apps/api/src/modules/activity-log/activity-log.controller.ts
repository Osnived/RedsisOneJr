import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type PaginatedResult } from '@redsis/contracts';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ActivityLogService, type ActivityLogView } from './activity-log.service';

@ApiTags('Registro de actividad')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLog: ActivityLogService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ACTIVITY_LOGS_VIEW)
  @ApiOperation({ summary: 'Consultar el historial de actividad' })
  list(@Query() pagination: PaginationQueryDto): Promise<PaginatedResult<ActivityLogView>> {
    return this.activityLog.list(pagination);
  }
}
