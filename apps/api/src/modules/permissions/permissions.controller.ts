import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { APP_MODULES, PERMISSIONS, type PermissionSummary } from '@redsis/contracts';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionsService, type PermissionsByModule } from './permissions.service';

@ApiTags('Permisos')
@ApiBearerAuth()
@RequireModule(APP_MODULES.SECURITY)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  @ApiOperation({ summary: 'Listar el catálogo completo de permisos' })
  list(): Promise<PermissionSummary[]> {
    return this.permissionsService.list();
  }

  @Get('by-module')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  @ApiOperation({
    summary: 'Listar el catálogo agrupado por módulo',
    description: 'Pensado para la pantalla de asignación de permisos a roles.',
  })
  listGroupedByModule(): Promise<PermissionsByModule[]> {
    return this.permissionsService.listGroupedByModule();
  }
}
