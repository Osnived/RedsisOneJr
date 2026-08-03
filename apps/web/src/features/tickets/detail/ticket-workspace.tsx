import type { TicketDetail } from '@redsis/contracts';
import { TicketActionsPanel } from './ticket-actions-panel';
import { TicketAuditLog } from './ticket-audit-log';
import { TicketHeader } from './ticket-header';
import { TicketInformation } from './ticket-information';
import { TicketTimeline } from './ticket-timeline';
import { TicketWorkflowPanel } from './ticket-workflow-panel';

/**
 * Espacio de trabajo de un ticket.
 *
 * Desde este release el ticket es el centro del sistema: la tabla solo sirve para
 * encontrarlo y toda la operación ocurre aquí.
 *
 * Reparte la pantalla en secciones con nombre, sin pestañas. Unas pestañas
 * esconderían la mitad del servicio detrás de un clic, y quien abre un ticket
 * necesita ver a la vez en qué punto está y qué ha pasado.
 *
 * El orden del marcado es el orden de lectura en un móvil —cabecera, información,
 * historia, cambios y por último las acciones—, y en escritorio la rejilla lleva
 * las acciones a una columna propia que acompaña al desplazamiento. Es la misma
 * pantalla en dos formas, no una con partes escondidas (ver AGENTS.md).
 *
 * Cada sección consulta lo que necesita: el timeline y la auditoría crecen por su
 * cuenta cada vez que alguien actúa, y volver a leer el ticket entero para
 * enterarse sería pedir de más.
 *
 * Vive en la feature y no en la ruta porque conoce el dominio. Recibe un ticket ya
 * resuelto, así que se prueba sin montar el enrutador.
 */
export function TicketWorkspace({ ticket }: { ticket: TicketDetail }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <TicketHeader ticket={ticket} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <TicketInformation ticket={ticket} />
          <TicketTimeline ticketId={ticket.id} />
          <TicketAuditLog ticketId={ticket.id} />
        </div>

        {/* En escritorio las acciones acompañan el desplazamiento: se decide
            mirando el timeline, y bajar a buscar el botón lo perdería de vista. */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
          <TicketWorkflowPanel ticket={ticket} />
          <TicketActionsPanel ticket={ticket} />
        </aside>
      </div>

      {/* Deja sitio para la barra fija de la intervención, que en móvil flota sobre
          el final de la página. Sin este hueco taparía la última acción. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}
