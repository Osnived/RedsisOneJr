import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService, type HealthStatus } from './health.service';

/**
 * Estado del servicio. Lo consultan Docker y el pipeline de despliegue,
 * por eso es público y no requiere autenticación.
 */
@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificar el estado del servicio y la base de datos' })
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}
