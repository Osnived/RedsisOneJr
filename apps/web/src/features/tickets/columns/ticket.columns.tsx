import { STANDARD_TICKET_COLUMNS, type Ticket } from '@redsis/contracts';
import type { ColumnDefinition } from '@/shared/types/table';
import { buildTicketColumns } from './build-ticket-columns';

/**
 * Columnas de Tickets cuando el proyecto no declara las suyas.
 *
 * Ya no se escriben a mano: se **construyen** desde el catálogo de columnas
 * estándar del contrato compartido. Antes esta lista y el catálogo habrían sido dos
 * copias de lo mismo, y bastaba con que una cambiara para que las vistas guardadas
 * de los usuarios apuntaran a columnas inexistentes.
 *
 * Es también el respaldo cuando el origen no sabe describirse: un proveedor que no
 * entregue estructura de columnas hace que la tabla se dibuje con estas.
 *
 * Se declara en el ámbito del módulo para que su identidad sea estable, que es lo
 * que el DataTable necesita para no reconstruir las columnas en cada render.
 */
export const ticketColumns: ColumnDefinition<Ticket>[] =
  buildTicketColumns(STANDARD_TICKET_COLUMNS);

/** Identidad estable de una fila de Tickets. */
export const getTicketRowId = (ticket: Ticket): string => ticket.id;
