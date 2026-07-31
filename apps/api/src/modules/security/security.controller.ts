import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  APP_MODULES,
  APP_MODULE_DEFINITIONS,
  PERMISSIONS,
  type AccessCatalog,
  type RoleAccessAuditEntry,
  type RoleSummary,
} from '@redsis/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleAccessDto } from './dto/update-role-access.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SecurityService } from './security.service';

/**
 * Administración de accesos de la plataforma.
 *
 * Todo el controlador exige acceso al módulo Seguridad además del permiso
 * concreto de cada operación: son las dos puertas, y la interfaz aplica
 * exactamente la misma regla.
 */
@ApiTags('Seguridad')
@ApiBearerAuth()
@RequireModule(APP_MODULES.SECURITY)
@Controller('security')
export class SecurityController {
  constructor(
    private readonly security: SecurityService,
    private readonly permissions: PermissionsService,
  ) {}

  /**
   * Todo lo que la pantalla necesita para dibujarse: qué módulos existen y qué
   * permisos hay. Va en una sola petición porque son dos catálogos que no
   * significan nada por separado.
   */
  @Get('catalog')
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  @ApiOperation({ summary: 'Catálogo de módulos y permisos sobre los que se concede acceso' })
  async getCatalog(): Promise<AccessCatalog> {
    return {
      modules: APP_MODULE_DEFINITIONS,
      permissions: await this.permissions.list(),
    };
  }

  @Get('roles')
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  @ApiOperation({ summary: 'Listar roles con sus módulos y permisos' })
  listRoles(): Promise<RoleSummary[]> {
    return this.security.listRoles();
  }

  @Get('roles/:id')
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  @ApiOperation({ summary: 'Obtener un rol por identificador' })
  findRole(@Param('id', ParseUUIDPipe) id: string): Promise<RoleSummary> {
    return this.security.findRoleById(id);
  }

  @Post('roles')
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  @ApiOperation({ summary: 'Crear un rol sin accesos' })
  createRole(@Body() body: CreateRoleDto): Promise<RoleSummary> {
    return this.security.createRole(body);
  }

  @Patch('roles/:id')
  @RequirePermissions(PERMISSIONS.ROLES_EDIT)
  @ApiOperation({ summary: 'Renombrar, describir, activar o desactivar un rol' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleDto,
  ): Promise<RoleSummary> {
    return this.security.updateRole(id, body);
  }

  @Patch('roles/:id/access')
  @RequirePermissions(PERMISSIONS.ROLES_EDIT)
  @ApiOperation({
    summary: 'Reemplazar los módulos y permisos de un rol',
    description: 'El motivo del cambio es obligatorio y queda registrado en la auditoría.',
  })
  updateRoleAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleAccessDto,
    @CurrentUser() user: RequestUser,
  ): Promise<RoleSummary> {
    return this.security.updateRoleAccess(id, body, user.id);
  }

  @Get('roles/:id/audit')
  @RequirePermissions(PERMISSIONS.ACTIVITY_LOGS_VIEW)
  @ApiOperation({ summary: 'Historial de cambios de acceso de un rol' })
  listAudit(@Param('id', ParseUUIDPipe) id: string): Promise<RoleAccessAuditEntry[]> {
    return this.security.listAccessAudit(id);
  }
}
