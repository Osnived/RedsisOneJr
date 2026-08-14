import { httpTicketProvider } from './providers/http-ticket.provider';
import type { TicketRepository } from './tickets.repository';

/**
 * Origen de datos de Tickets que usa la aplicación.
 *
 * Esta línea es el único sitio donde se decide de dónde salen los tickets **para
 * el frontend**, y desde que Tickets tiene módulo en NestJS la respuesta es
 * siempre la misma: de la API.
 *
 * Qué hay detrás de esa API —el origen simulado, RedsisOne, Baserow o
 * ServiceNow— lo decide `TicketProviderRegistry` en el backend a partir de la
 * fuente de datos configurada. React no lo sabe, y esa es la frontera que la
 * arquitectura existe para sostener (ver AGENTS.md y el ADR 0003).
 *
 * Se conserva la indirección aunque hoy solo haya una implementación porque es lo
 * que permite montar la aplicación contra un doble en las pruebas sin tocar ningún
 * hook ni ninguna pantalla.
 */
export const ticketRepository: TicketRepository = httpTicketProvider;
