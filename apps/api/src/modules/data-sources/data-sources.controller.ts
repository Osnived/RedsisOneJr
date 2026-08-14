import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  APP_MODULES,
  DATA_SOURCE_PROVIDER_DEFINITIONS,
  PERMISSIONS,
  type DataSourceConnectionTest,
  type DataSourceProviderDefinition,
  type DataSourceSummary,
} from '@redsis/contracts';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { DataSourcesService } from './data-sources.service';
import {
  CreateDataSourceDto,
  TestDataSourceConnectionDto,
  UpdateDataSourceDto,
} from './dto/data-source.dto';

/**
 * Administración de las fuentes de datos.
 *
 * Vive dentro del módulo Configuración, que el catálogo ya declaraba para los
 * ajustes de la plataforma. Los permisos son propios (`data-sources.*`) y no
 * `settings.edit` porque conceden acceso a credenciales de sistemas externos:
 * quien puede cambiar un ajuste de la plataforma no tiene por qué poder apuntar
 * los tickets a otro servidor.
 *
 * **Ninguna respuesta contiene credenciales.** Salen todas por `toSummary`, en el
 * servicio, que no las incluye.
 */
@ApiTags('Fuentes de datos')
@ApiBearerAuth()
@RequireModule(APP_MODULES.SETTINGS)
@Controller('data-sources')
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Get('providers')
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_VIEW)
  @ApiOperation({
    summary: 'Catálogo de proveedores',
    description:
      'Qué proveedores existen, qué parámetros pide cada uno y cuáles están implementados. La pantalla dibuja el formulario a partir de esto.',
  })
  listProviders(): readonly DataSourceProviderDefinition[] {
    return DATA_SOURCE_PROVIDER_DEFINITIONS;
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_VIEW)
  @ApiOperation({ summary: 'Listar las fuentes configuradas, sin sus credenciales' })
  list(): Promise<DataSourceSummary[]> {
    return this.dataSourcesService.list();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_VIEW)
  @ApiOperation({ summary: 'Obtener una fuente de datos' })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<DataSourceSummary> {
    return this.dataSourcesService.findById(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_CREATE)
  @ApiOperation({ summary: 'Crear una fuente de datos' })
  create(@Body() body: CreateDataSourceDto): Promise<DataSourceSummary> {
    return this.dataSourcesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_EDIT)
  @ApiOperation({
    summary: 'Actualizar una fuente de datos',
    description: 'Omitir las credenciales conserva las guardadas.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDataSourceDto,
  ): Promise<DataSourceSummary> {
    return this.dataSourcesService.update(id, body);
  }

  @Patch(':id/default')
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_EDIT)
  @ApiOperation({ summary: 'Designar la fuente que atiende por defecto' })
  setDefault(@Param('id', ParseUUIDPipe) id: string): Promise<DataSourceSummary> {
    return this.dataSourcesService.setDefault(id);
  }

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_EDIT)
  @ApiOperation({
    summary: 'Probar una configuración contra el proveedor',
    description:
      'Admite una configuración todavía sin guardar. Probar exige permiso de edición: lanza una petición saliente con las credenciales configuradas.',
  })
  testConnection(@Body() body: TestDataSourceConnectionDto): Promise<DataSourceConnectionTest> {
    return this.dataSourcesService.testConnection(body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.DATA_SOURCES_DELETE)
  @ApiOperation({
    summary: 'Retirar una fuente de datos',
    description: 'La fuente por defecto no se puede retirar mientras lo sea.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.dataSourcesService.remove(id);
  }
}
