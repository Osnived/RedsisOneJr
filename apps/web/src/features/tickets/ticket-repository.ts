import { mockTicketProvider } from './providers/mock-ticket.provider';
import type { TicketRepository } from './tickets.repository';

/**
 * Origen de datos de Tickets que usa la aplicación.
 *
 * Esta línea es el único sitio donde se decide de dónde salen los tickets. Es el
 * equivalente en el frontend de lo que en NestJS es
 * `{ provide: TicketRepository, useClass: BaserowTicketProvider }`: el mismo
 * patrón, un solo punto de sustitución.
 *
 * Conectar el origen real será cambiar `mockTicketProvider` por el proveedor que
 * llame a la API. Nada más: los hooks consumen el contrato, y las pantallas
 * consumen los hooks.
 *
 * Existe aquí y no en el backend porque Tickets todavía no tiene módulo en NestJS
 * —es lo primero del próximo release—. Mientras eso llegue, la frontera está
 * declarada y nadie la puede saltar sin que se note.
 */
export const ticketRepository: TicketRepository = mockTicketProvider;
