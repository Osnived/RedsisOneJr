import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DATA_SOURCE_PROVIDERS,
  findDataSourceProvider,
  type DataSourceProvider,
} from '@redsis/contracts';
import type { Env } from '../../config/env.schema';
import { MockTicketProvider } from './providers/mock-ticket.provider';
import { TicketRepository } from './ticket.repository';

/**
 * Registro de proveedores de Tickets.
 *
 * Es el único sitio donde se decide qué implementación atiende una petición. Sin
 * él, elegir origen acabaría en condicionales repartidos por servicios y
 * componentes, que es justo lo que prohíbe el §9 del MVP.
 *
 * ## Por qué no basta con `{ provide, useClass }`
 *
 * El resto de módulos fija su origen al arrancar, y para ellos es correcto: solo
 * hay una base de datos. Tickets no puede: cada proyecto es un tablero distinto y
 * dos proyectos pueden estar en proveedores distintos, así que la implementación
 * se resuelve **por petición** y no al construir el módulo.
 *
 * Es la misma idea del patrón —un contrato, varias implementaciones, un solo punto
 * de decisión— con el punto de decisión movido de la construcción a la ejecución.
 * El cambio está registrado en `docs/adr/0003-registro-de-proveedores-de-datos.md`.
 *
 * ## Qué falta
 *
 * Hoy el proveedor activo sale de `TICKETS_PROVIDER`. Cuando exista la
 * administración de fuentes de datos, saldrá de la fuente configurada y este
 * registro no cambiará: seguirá resolviendo una clave a una implementación.
 */
@Injectable()
export class TicketProviderRegistry implements OnModuleInit {
  private readonly logger = new Logger(TicketProviderRegistry.name);

  /**
   * Implementaciones disponibles.
   *
   * Un proveedor declarado en el catálogo pero ausente de este mapa está
   * declarado y sin implementar. Añadir RedsisOne es escribir su Provider y una
   * entrada aquí; no se toca ni el servicio, ni el controlador, ni el frontend.
   */
  private readonly providers: ReadonlyMap<DataSourceProvider, TicketRepository>;

  constructor(
    mockProvider: MockTicketProvider,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.providers = new Map<DataSourceProvider, TicketRepository>([
      [DATA_SOURCE_PROVIDERS.MOCK, mockProvider],
    ]);
  }

  /**
   * Comprueba al arrancar que el proveedor configurado existe de verdad.
   *
   * Se falla al inicio y no en la primera petición, por la misma razón que la
   * validación del entorno: descubrir que el origen no está implementado con la
   * plataforma en funcionamiento es el peor momento posible.
   */
  onModuleInit(): void {
    const active = this.activeProviderKey();

    if (!this.providers.has(active)) {
      const definition = findDataSourceProvider(active);

      throw new Error(
        `TICKETS_PROVIDER=${active} (${definition?.label ?? 'desconocido'}) está declarado pero no implementado. ` +
          `Proveedores disponibles: ${[...this.providers.keys()].join(', ')}.`,
      );
    }

    this.logger.log(`Origen de tickets: ${findDataSourceProvider(active)?.label ?? active}`);
  }

  /** El proveedor que atiende las peticiones mientras no haya fuentes configurables. */
  active(): TicketRepository {
    return this.resolve(this.activeProviderKey());
  }

  /**
   * Implementación de un proveedor concreto.
   *
   * Lanza si no está implementado en lugar de devolver el simulado por descarte:
   * servir datos de prueba creyendo que son reales es peor que no servir nada.
   */
  resolve(provider: DataSourceProvider): TicketRepository {
    const implementation = this.providers.get(provider);

    if (implementation === undefined) {
      throw new Error(`El proveedor ${provider} no tiene implementación registrada.`);
    }

    return implementation;
  }

  isImplemented(provider: DataSourceProvider): boolean {
    return this.providers.has(provider);
  }

  private activeProviderKey(): DataSourceProvider {
    return this.configService.get('TICKETS_PROVIDER', { infer: true });
  }
}
