import { Injectable } from '@nestjs/common';
import { HealthRepository } from './health.repository';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  timestamp: string;
}

/**
 * Estado del servicio.
 *
 * El servicio decide qué significa "degradado"; el Repository solo informa si el
 * origen responde. Esa separación es la que permite comprobar la regla sin una
 * base de datos real.
 */
@Injectable()
export class HealthService {
  constructor(private readonly health: HealthRepository) {}

  async check(): Promise<HealthStatus> {
    const isReachable = await this.health.isReachable();

    return {
      status: isReachable ? 'ok' : 'degraded',
      database: isReachable ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
