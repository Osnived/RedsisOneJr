import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type RoleSummary } from '@redsis/contracts';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  @ApiOperation({ summary: 'Listar roles con sus permisos' })
  list(): Promise<RoleSummary[]> {
    return this.rolesService.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  @ApiOperation({ summary: 'Obtener un rol por identificador' })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<RoleSummary> {
    return this.rolesService.findById(id);
  }
}
