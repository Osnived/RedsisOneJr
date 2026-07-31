import type { Ticket } from '@redsis/contracts';

/**
 * Contrato que cumple toda vista de Tickets.
 *
 * Es lo que garantiza que la tabla, las tarjetas y las vistas futuras —Kanban,
 * Calendario, Timeline, Mapa— consuman exactamente el mismo origen de datos: la
 * página consulta una sola vez y entrega el resultado. Ninguna vista consulta
 * por su cuenta, así que no pueden discrepar ni duplicar peticiones.
 *
 * Ninguna vista recibe lógica de negocio, solo datos y avisos.
 */
export interface TicketViewProps {
  tickets: Ticket[];
  loading: boolean;
  error: Error | null;

  /** Se invoca al pedir el detalle de un ticket. */
  onViewDetail: (ticket: Ticket) => void;

  /** Solo lo soportan las vistas que permiten seleccionar. */
  onSelectionChange?: (tickets: Ticket[]) => void;
}
