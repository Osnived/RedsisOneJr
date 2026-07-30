import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@redsis/contracts';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionsService, type PermissionsByModule } from './permissions.service';

@ApiTags('Permisos')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  @ApiOperation({ summary: 'Listar el catálogo de permisos agrupado por módulo' })
  list(): Promise<PermissionsByModule[]> {
    return this.permissionsService.listGroupedByModule();
  }
}
