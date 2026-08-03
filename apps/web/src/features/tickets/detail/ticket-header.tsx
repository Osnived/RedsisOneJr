import type { TicketDetail } from '@redsis/contracts';
import { DateTime } from '@/shared/components/ui/date-time';
import { DetailField, DetailFieldList } from '@/shared/components/ui/detail-field';
import { TicketPriorityBadge, TicketStatusBadge } from '../ticket-badges';

/**
 * Cabecera de un ticket.
 *
 * Responde de un vistazo las preguntas que se hacen al abrirlo: qué servicio es,
 * en qué situación está, para quién, dónde y quién lo atiende. Todo lo demás
 * —historia, cambios, acciones— viene debajo.
 *
 * Es reutilizable dentro del módulo: cualquier pantalla que presente un ticket
 * monta esta cabecera en lugar de rehacerla. No vive en `shared/` porque conoce el
 * dominio: sabe qué es una zona y qué es un técnico.
 *
 * El número es el `h1` de la pantalla porque es lo que identifica el servicio
 * durante toda su vida (ver PROJECT_CONTEXT.md).
 *
 * En pantalla pequeña los campos se apilan y el número y las etiquetas quedan
 * arriba: es lo que el técnico necesita leer sin desplazarse.
 */
export function TicketHeader({ ticket }: { ticket: TicketDetail }): React.JSX.Element {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="text-2xl font-semibold">{ticket.number}</h1>

        <div className="flex flex-wrap items-center gap-1.5">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <DetailFieldList className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DetailField label="Cliente" value={ticket.clientName} />
        <DetailField label="Sucursal" value={ticket.branchName} />
        <DetailField label="Zona" value={ticket.zoneName} />
        <DetailField label="Técnico" value={ticket.technicianName} emptyLabel="Sin asignar" />
        <DetailField label="Creación">
          <DateTime value={ticket.createdAt} />
        </DetailField>
      </DetailFieldList>
    </header>
  );
}
