import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '@redsis/contracts';
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge';
import { defineColumns } from '@/shared/lib/table/registry';

/**
 * Columnas del módulo de Tickets.
 *
 * Este archivo es lo único que el módulo aporta para tener su tabla: no contiene
 * consultas, ni estado, ni componentes de página. El DataTable no lo conoce; es
 * la página la que se lo entrega.
 *
 * Se usa extensión `.tsx` porque las columnas de estado y prioridad definen su
 * propio render. Mantener el render junto a la definición es lo que permite que
 * un módulo nuevo solo necesite este archivo.
 */

/**
 * Color de cada estado. Vive en el módulo y no en el componente Badge porque el
 * significado de un estado es conocimiento del dominio, no de la interfaz.
 */
const STATUS_VARIANT: Record<TicketStatus, BadgeVariant> = {
  nuevo: 'info',
  asignado: 'info',
  'en-ruta': 'warning',
  'en-sitio': 'warning',
  pendiente: 'neutral',
  resuelto: 'success',
  cancelado: 'danger',
};

const PRIORITY_VARIANT: Record<TicketPriority, BadgeVariant> = {
  baja: 'neutral',
  media: 'info',
  alta: 'warning',
  critica: 'danger',
};

/**
 * Traduce un código a su etiqueta cuando se agrupa.
 *
 * El valor llega como `unknown` porque el framework no conoce el dominio; si no
 * corresponde a ningún código conocido se muestra tal cual en lugar de vacío,
 * que ocultaría un dato inesperado en vez de delatarlo.
 */
function labelOf(labels: Record<string, string>, value: unknown): string {
  return typeof value === 'string' ? (labels[value] ?? value) : String(value);
}

export const ticketColumns = defineColumns<Ticket>([
  {
    id: 'number',
    header: 'Ticket',
    accessor: (ticket) => ticket.number,
    // El número identifica el servicio durante toda su vida: nunca se oculta.
    hideable: false,
    width: 150,
    cell: (ticket) => <span className="font-medium">{ticket.number}</span>,
  },
  {
    id: 'clientName',
    header: 'Cliente',
    accessor: (ticket) => ticket.clientName,
    width: 180,
  },
  {
    id: 'branchName',
    header: 'Sucursal',
    accessor: (ticket) => ticket.branchName,
    width: 180,
  },
  {
    id: 'city',
    header: 'Ciudad',
    accessor: (ticket) => ticket.city,
    width: 140,
    groupable: true,
  },
  {
    id: 'status',
    header: 'Estado',
    // El accesor devuelve el código y no la etiqueta: así el orden y la búsqueda
    // operan sobre el dato real, no sobre su representación.
    accessor: (ticket) => ticket.status,
    width: 130,
    align: 'center',
    groupable: true,
    // El grupo debe leerse "En ruta", no "en-ruta": traducir el código es
    // conocimiento del dominio y por eso vive aquí.
    groupLabel: (value) => labelOf(TICKET_STATUS_LABELS, value),
    cell: (ticket) => (
      <Badge variant={STATUS_VARIANT[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
    ),
  },
  {
    id: 'priority',
    header: 'Prioridad',
    accessor: (ticket) => ticket.priority,
    width: 120,
    align: 'center',
    groupable: true,
    groupLabel: (value) => labelOf(TICKET_PRIORITY_LABELS, value),
    cell: (ticket) => (
      <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
        {TICKET_PRIORITY_LABELS[ticket.priority]}
      </Badge>
    ),
  },
  {
    id: 'technicianName',
    header: 'Técnico',
    accessor: (ticket) => ticket.technicianName,
    width: 170,
    groupable: true,
  },
  {
    id: 'createdAt',
    header: 'Creación',
    // Se devuelve Date y no el texto ISO para que el orden sea cronológico
    // y el formato lo aplique el framework de forma uniforme.
    accessor: (ticket) => new Date(ticket.createdAt),
    width: 130,
  },
  {
    id: 'updatedAt',
    header: 'Última actualización',
    accessor: (ticket) => new Date(ticket.updatedAt),
    width: 170,
    // Dato de seguimiento, útil pero secundario: no satura la vista inicial.
    hiddenByDefault: true,
  },
]);

/** Identidad estable de una fila de Tickets. */
export const getTicketRowId = (ticket: Ticket): string => ticket.id;
