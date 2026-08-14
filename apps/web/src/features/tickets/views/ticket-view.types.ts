import type { Ticket } from '@redsis/contracts';
import type { ColumnDefinition, TableQuery } from '@/shared/types/table';

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
  /** La página actual, no todos los tickets: el origen pagina en el servidor. */
  tickets: Ticket[];

  /**
   * Columnas que declara el proyecto.
   *
   * Llegan construidas desde la configuración de la fuente de datos, así que dos
   * proyectos con estructuras distintas usan la misma vista sin modificarla.
   */
  columns: ColumnDefinition<Ticket>[];

  /** Total de registros que cumplen la consulta. Sin él no se puede paginar. */
  totalRows: number;

  loading: boolean;
  error: Error | null;

  /**
   * Se invoca cuando cambia la página, el orden, la búsqueda o los filtros.
   *
   * La vista no consulta: avisa. Quien pide los datos es la página, que es la
   * única que conoce el hook.
   */
  onQueryChange: (query: TableQuery) => void;

  /**
   * Se invoca al elegir un ticket, y lleva a su pantalla.
   *
   * Ninguna vista actúa sobre el ticket: desde el Release 0.7 la operación entera
   * ocurre en su espacio de trabajo, y estas vistas solo sirven para encontrarlo.
   */
  onViewDetail: (ticket: Ticket) => void;

  /** Solo lo soportan las vistas que permiten seleccionar. */
  onSelectionChange?: (tickets: Ticket[]) => void;
}
