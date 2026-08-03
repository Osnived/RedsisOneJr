import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from '@redsis/contracts';
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge';

/**
 * Estado y prioridad de un ticket, con su color.
 *
 * Qué color corresponde a cada estado es conocimiento del dominio, no de la
 * interfaz: el componente `Badge` no sabe qué es "en ruta". Por eso el mapa vive en
 * la feature.
 *
 * Está en un solo sitio porque el mismo estado se pinta en la tabla, en las
 * tarjetas, en la cabecera del ticket y en su auditoría. Con una copia por
 * pantalla, un estado nuevo se olvidaba en alguna y aparecía en gris sin que nadie
 * lo notara; aquí TypeScript obliga a completar el mapa una vez.
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

export function TicketStatusBadge({ status }: { status: TicketStatus }): React.JSX.Element {
  return <Badge variant={STATUS_VARIANT[status]}>{TICKET_STATUS_LABELS[status]}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }): React.JSX.Element {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{TICKET_PRIORITY_LABELS[priority]}</Badge>;
}
