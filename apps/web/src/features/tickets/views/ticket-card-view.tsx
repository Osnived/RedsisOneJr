import { Building2, CalendarDays, MapPin, UserRound } from 'lucide-react';
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { EMPTY_CELL } from '@/shared/lib/table/format-cell-value';
import type { TicketViewProps } from './ticket-view.types';

/**
 * Colores de estado y prioridad.
 *
 * Se repiten respecto al archivo de columnas a propósito: son dos
 * representaciones distintas del mismo dominio y compartirlos ataría la tabla a
 * las tarjetas. Si el catálogo crece, TypeScript obliga a completar ambos.
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
 * Tickets en tarjetas.
 *
 * Es la vista del técnico en campo: una tarjeta por servicio, con lo que
 * necesita para decidir a dónde va y sin nada que requiera precisión de ratón.
 *
 * Una tabla en un móvil obliga a desplazarse en horizontal para leer una sola
 * fila; aquí cada ticket se lee de arriba abajo.
 *
 * No permite editar ni actuar sobre el ticket más allá de pedir su detalle.
 */
export function TicketCardView({
  tickets,
  loading,
  error,
  onViewDetail,
}: TicketViewProps): React.JSX.Element {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive">{error.message}</Alert>;
  }

  if (tickets.length === 0) {
    return <Alert>No hay tickets asignados.</Alert>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <TicketCard ticket={ticket} onViewDetail={onViewDetail} />
        </li>
      ))}
    </ul>
  );
}

function TicketCard({
  ticket,
  onViewDetail,
}: {
  ticket: Ticket;
  onViewDetail: (ticket: Ticket) => void;
}): React.JSX.Element {
  return (
    <article
      aria-labelledby={`ticket-${ticket.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id={`ticket-${ticket.id}`} className="font-medium">
          {ticket.number}
        </h2>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant={STATUS_VARIANT[ticket.status]}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </Badge>
          <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
            {TICKET_PRIORITY_LABELS[ticket.priority]}
          </Badge>
        </div>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <Field icon={Building2} label="Cliente" value={ticket.clientName} />
        <Field icon={MapPin} label="Sucursal" value={`${ticket.branchName}, ${ticket.city}`} />
        <Field icon={UserRound} label="Técnico" value={ticket.technicianName} />
        <Field icon={CalendarDays} label="Creación" value={formatDate(ticket.createdAt)} />
      </dl>

      {/* Ancho completo: en un móvil el pulgar no acierta un botón pequeño. */}
      <Button variant="outline" className="w-full" onClick={() => onViewDetail(ticket)}>
        Ver detalle
      </Button>
    </article>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className={value === null ? 'text-muted-foreground' : undefined}>
        {value ?? `Sin ${label.toLocaleLowerCase('es')}`}
      </dd>
    </div>
  );
}

/** Las fechas llegan en ISO y se muestran como las lee una persona. */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  return Number.isNaN(date.getTime()) ? EMPTY_CELL : date.toLocaleDateString('es');
}
