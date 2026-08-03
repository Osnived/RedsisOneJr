import type { TicketDetail } from '@redsis/contracts';
import { DetailSection } from '@/shared/components/layout/detail-section';
import { DateTime } from '@/shared/components/ui/date-time';
import { DetailField, DetailFieldList } from '@/shared/components/ui/detail-field';
import { TicketPriorityBadge, TicketStatusBadge } from '../ticket-badges';

/**
 * Información general del ticket. Solo lectura.
 *
 * Repite el estado, la prioridad y el cliente que ya muestra la cabecera a
 * propósito: la cabecera se lee de un vistazo y esta sección es la ficha completa
 * del servicio, que es donde se mira cuando hace falta el dato exacto —la
 * dirección a la que hay que ir, la categoría con la que se clasificó—.
 *
 * Aquí no se edita nada. Cambiar un dato del ticket se hace desde el panel de
 * acciones, y así queda claro qué es información y qué es una operación.
 */
export function TicketInformation({ ticket }: { ticket: TicketDetail }): React.JSX.Element {
  return (
    <DetailSection title="Información general">
      <DetailFieldList className="sm:grid-cols-2 xl:grid-cols-3">
        <DetailField label="Cliente" value={ticket.clientName} />
        <DetailField label="Sucursal" value={ticket.branchName} />

        {/* La dirección ocupa dos columnas: cortarla obligaría a adivinarla. */}
        <DetailField label="Dirección" value={ticket.address} />

        <DetailField label="Ciudad" value={ticket.city} />
        <DetailField label="Zona" value={ticket.zoneName} />
        <DetailField label="Categoría" value={ticket.categoryName} />

        <DetailField label="Prioridad">
          <TicketPriorityBadge priority={ticket.priority} />
        </DetailField>

        <DetailField label="Estado">
          <TicketStatusBadge status={ticket.status} />
        </DetailField>

        <DetailField label="Técnico" value={ticket.technicianName} emptyLabel="Sin asignar" />

        <DetailField label="Creación">
          <DateTime value={ticket.createdAt} />
        </DetailField>

        <DetailField label="Última actualización">
          <DateTime value={ticket.updatedAt} />
        </DetailField>
      </DetailFieldList>
    </DetailSection>
  );
}
