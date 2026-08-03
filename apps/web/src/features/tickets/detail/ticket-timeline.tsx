import {
  ArrowRightLeft,
  ClipboardList,
  Flag,
  Footprints,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  TICKET_EVENT_KIND_LABELS,
  type TicketEvent,
  type TicketEventKind,
} from '@redsis/contracts';
import { DetailSection } from '@/shared/components/layout/detail-section';
import { Alert } from '@/shared/components/ui/alert';
import { DateTime } from '@/shared/components/ui/date-time';
import { Spinner } from '@/shared/components/ui/spinner';
import { useTicketTimeline } from '../use-tickets';

/**
 * Icono de cada clase de suceso.
 *
 * Es presentación, así que vive en el componente y no en el contrato: el dato
 * guarda el código del suceso y aquí se decide con qué se dibuja.
 */
const EVENT_ICON: Record<TicketEventKind, LucideIcon> = {
  creado: ClipboardList,
  asignado: UserPlus,
  'cambio-de-estado': ArrowRightLeft,
  'cambio-de-prioridad': Flag,
  observacion: MessageSquare,
  'paso-de-la-intervencion': Footprints,
};

/**
 * Timeline operativo del ticket.
 *
 * Cuenta lo que ha pasado durante el servicio: quién hizo qué y cuándo. Es la
 * historia de la operación, no el registro de cambios de datos —eso es la
 * auditoría, y está en su propia sección para que treinta líneas técnicas no
 * escondan que el técnico llegó.
 *
 * Se muestra de lo más reciente a lo más antiguo. Un servicio en marcha se abre
 * para saber cómo va, y con el orden cronológico habría que desplazarse hasta el
 * final cada vez que el timeline crece.
 *
 * Consulta sus propios datos en lugar de recibirlos: el timeline cambia por su
 * cuenta cada vez que alguien actúa, y volver a leer el ticket entero para
 * enterarse sería pedir de más.
 */
export function TicketTimeline({ ticketId }: { ticketId: string }): React.JSX.Element {
  const timelineQuery = useTicketTimeline(ticketId);

  return (
    <DetailSection title="Timeline" description="Lo que ha ocurrido durante el servicio">
      {renderTimeline()}
    </DetailSection>
  );

  function renderTimeline(): React.JSX.Element {
    if (timelineQuery.isPending) {
      return (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      );
    }

    if (timelineQuery.isError) {
      return <Alert variant="destructive">{timelineQuery.error.message}</Alert>;
    }

    if (timelineQuery.data.length === 0) {
      return <p className="text-sm text-muted-foreground">Todavía no ha ocurrido nada.</p>;
    }

    // Se copia antes de invertir: `data` es la caché de la consulta y ordenarla en
    // el sitio la alteraría para todo el que la comparta.
    const events = [...timelineQuery.data].reverse();

    return (
      <ol className="flex flex-col">
        {events.map((event, index) => (
          <TimelineEntry key={event.id} event={event} isLast={index === events.length - 1} />
        ))}
      </ol>
    );
  }
}

/**
 * Una entrada del timeline.
 *
 * El hilo vertical se dibuja con un borde en la columna del icono y se corta en la
 * última entrada, para que la línea no siga hacia la nada.
 */
function TimelineEntry({
  event,
  isLast,
}: {
  event: TicketEvent;
  isLast: boolean;
}): React.JSX.Element {
  const Icon = EVENT_ICON[event.kind];

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>

        {isLast ? null : <span className="w-px flex-1 bg-border" aria-hidden="true" />}
      </div>

      <div className={isLast ? 'min-w-0 pb-0' : 'min-w-0 pb-5'}>
        <p className="text-sm">{event.description}</p>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {/* La clase de suceso se nombra para quien no distingue los iconos. */}
          <span className="sr-only">{TICKET_EVENT_KIND_LABELS[event.kind]}.</span>
          <span>{event.userName}</span>
          <span aria-hidden="true">·</span>
          <DateTime value={event.occurredAt} format="date" />
          <DateTime value={event.occurredAt} format="time" />
        </p>

        {/* Aquí irán la posición del técnico y las fotografías del servicio. El
            contrato ya las transporta (`location`, `attachments`) y hoy llegan
            siempre vacías: la entrada no cambia de forma cuando se implementen. */}
      </div>
    </li>
  );
}
