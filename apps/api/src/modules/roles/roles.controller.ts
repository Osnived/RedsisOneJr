import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type RoleSummary } from '@redsis/contracts';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { RolesService } from './roles.service';

/**
 * Consulta de roles para el resto de la plataforma.
 *
 * A propósito **no** exige acceso al módulo Seguridad: quien administra usuarios
 * necesita ver los nombres de los roles para asignarlos, y obligarle a entrar en
 * Seguridad para eso le daría mucho más de lo que necesita. La administración de
 * accesos vive en `/security`.
 */
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
