import { Module } from '@nestjs/common';
import { MockTicketProvider } from './providers/mock-ticket.provider';
import { TicketProviderRegistry } from './ticket-provider.registry';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

/**
 * Módulo de Tickets.
 *
 * A diferencia del resto, aquí no hay una línea `{ provide: TicketRepository,
 * useClass: ... }`: el origen no es uno solo. Cada proyecto puede estar en un
 * proveedor distinto, así que la implementación la resuelve
 * `TicketProviderRegistry` y lo que se declara aquí son las implementaciones
 * **disponibles**.
 *
 * Añadir RedsisOne, Baserow o ServiceNow es escribir su Provider, declararlo en
 * esta lista y registrarlo en el mapa del registro. Ni el servicio, ni el
 * controlador, ni el frontend cambian.
 */
@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketProviderRegistry, MockTicketProvider],
  exports: [TicketsService],
})
export class TicketsModule {}
