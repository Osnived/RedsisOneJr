import {
  TICKET_AUDIT_FIELDS,
  TICKET_AUDIT_FIELD_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketAuditField,
  type TicketFieldChange,
} from '@redsis/contracts';
import { DetailSection } from '@/shared/components/layout/detail-section';
import { Alert } from '@/shared/components/ui/alert';
import { DateTime } from '@/shared/components/ui/date-time';
import { DetailField, DetailFieldList } from '@/shared/components/ui/detail-field';
import { Spinner } from '@/shared/components/ui/spinner';
import { useTicketAuditLog } from '../use-tickets';

/**
 * Registro de cambios de datos del ticket. Solo lectura.
 *
 * Es una sección aparte del timeline y no una parte de él: el timeline cuenta la
 * operación —salió, llegó, terminó— y esto responde otra pregunta, quién cambió
 * qué y desde qué valor. Mezclarlos obliga a leer el detalle técnico de cada
 * cambio para encontrar lo que pasó en la sucursal.
 *
 * No se puede editar ni borrar. Un registro de cambios que se puede modificar no
 * sirve para lo que existe.
 *
 * Se presenta como fichas y no como tabla, también en escritorio: son cinco datos
 * por cambio y ninguno se compara entre filas, que es para lo que sirve una tabla.
 * Además así se lee igual con una sola mano (ver el MVP 9 del Release 0.7).
 */
export function TicketAuditLog({ ticketId }: { ticketId: string }): React.JSX.Element {
  const auditQuery = useTicketAuditLog(ticketId);

  return (
    <DetailSection title="Auditoría" description="Qué datos cambiaron, quién y cuándo">
      {renderAuditLog()}
    </DetailSection>
  );

  function renderAuditLog(): React.JSX.Element {
    if (auditQuery.isPending) {
      return (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      );
    }

    if (auditQuery.isError) {
      return <Alert variant="destructive">{auditQuery.error.message}</Alert>;
    }

    if (auditQuery.data.length === 0) {
      // Que no haya cambios es información, no un hueco.
      return <p className="text-sm text-muted-foreground">Ningún dato ha cambiado todavía.</p>;
    }

    const changes = [...auditQuery.data].reverse();

    return (
      <ol className="flex flex-col gap-3">
        {changes.map((change) => (
          <li key={change.id} className="rounded-md border border-border px-3 py-3">
            <AuditEntry change={change} />
          </li>
        ))}
      </ol>
    );
  }
}

function AuditEntry({ change }: { change: TicketFieldChange }): React.JSX.Element {
  return (
    <DetailFieldList className="gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <DetailField label="Campo" value={TICKET_AUDIT_FIELD_LABELS[change.field]} />

      <DetailField
        label="Valor anterior"
        value={describeValue(change.field, change.previousValue)}
        emptyLabel="Sin valor"
      />

      <DetailField label="Valor nuevo" value={describeValue(change.field, change.newValue)} />

      <DetailField label="Usuario" value={change.userName} />

      <DetailField label="Fecha">
        <DateTime value={change.changedAt} format="date" />
      </DetailField>

      <DetailField label="Hora">
        <DateTime value={change.changedAt} format="time" />
      </DetailField>
    </DetailFieldList>
  );
}

/**
 * Traduce el valor almacenado a lo que se lee en pantalla.
 *
 * La auditoría guarda el código que se escribió —`en-ruta`— porque es el dato real
 * (ver el contrato). Mostrarlo tal cual obligaría a quien audita a conocer los
 * códigos internos, así que la traducción ocurre aquí, en la presentación.
 *
 * Un valor que no corresponde a ningún código conocido se muestra tal cual: un
 * dato inesperado debe delatarse, no desaparecer.
 */
function describeValue(field: TicketAuditField, value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (field === TICKET_AUDIT_FIELDS.STATUS) {
    return labelOf(TICKET_STATUS_LABELS, value);
  }

  if (field === TICKET_AUDIT_FIELDS.PRIORITY) {
    return labelOf(TICKET_PRIORITY_LABELS, value);
  }

  return value;
}

/** Igual que en las columnas: un código sin etiqueta conocida se muestra tal cual. */
function labelOf(labels: Record<string, string>, value: string): string {
  return labels[value] ?? value;
}
