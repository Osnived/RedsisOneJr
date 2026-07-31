import type { ComponentType } from 'react';
import type { ViewKind } from '@/shared/lib/view-mode';
import { TicketCardView } from './ticket-card-view';
import { TicketTableView } from './ticket-table-view';
import type { TicketViewProps } from './ticket-view.types';

/**
 * Vistas disponibles del módulo de Tickets.
 *
 * Añadir Kanban, Calendario, Timeline o Mapa consiste en escribir un componente
 * que cumpla `TicketViewProps` y registrarlo aquí. No hay que tocar la página,
 * ni el hook que decide la vista, ni la consulta de datos: todas las vistas
 * reciben los mismos tickets del mismo Repository a través de la misma consulta
 * de React Query, y solo cambian cómo los dibujan.
 *
 * El registro es parcial porque las vistas pendientes están declaradas en
 * `ViewKind` pero todavía no existen.
 */
export const TICKET_VIEWS: Partial<Record<ViewKind, ComponentType<TicketViewProps>>> = {
  table: TicketTableView,
  cards: TicketCardView,
};

/**
 * Componente que representa una vista.
 *
 * Si la vista pedida aún no existe se cae a la tabla en lugar de dejar la
 * pantalla en blanco: un módulo debe seguir siendo consultable aunque su vista
 * preferida esté a medio construir.
 */
export function resolveTicketView(kind: ViewKind): ComponentType<TicketViewProps> {
  return TICKET_VIEWS[kind] ?? TicketTableView;
}
