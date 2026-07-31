import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  APP_MODULES,
  PERMISSIONS,
  type PaginatedResult,
  type UserSummary,
} from '@redsis/contracts';
import { Ip } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { RequestUser } from '../../common/types/request-user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@RequireModule(APP_MODULES.USERS)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  @ApiOperation({ summary: 'Listar usuarios de forma paginada' })
  list(@Query() pagination: PaginationQueryDto): Promise<PaginatedResult<UserSummary>> {
    return this.usersService.list(pagination);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  @ApiOperation({ summary: 'Obtener un usuario por identificador' })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<UserSummary> {
    return this.usersService.findById(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  @ApiOperation({ summary: 'Crear un usuario' })
  create(
    @Body() body: CreateUserDto,
    @CurrentUser() actor: RequestUser,
    @Ip() ipAddress: string,
  ): Promise<UserSummary> {
    return this.usersService.create(body, { actorId: actor.id, ipAddress });
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_EDIT)
  @ApiOperation({ summary: 'Actualizar un usuario' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
    @Ip() ipAddress: string,
  ): Promise<UserSummary> {
    return this.usersService.update(id, body, { actorId: actor.id, ipAddress });
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  @ApiOperation({
    summary: 'Desactivar un usuario',
    description: 'Los usuarios no se eliminan: se desactivan para conservar la trazabilidad.',
  })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
    @Ip() ipAddress: string,
  ): Promise<{ id: string; isActive: boolean }> {
    return this.usersService.deactivate(id, { actorId: actor.id, ipAddress });
  }
}
