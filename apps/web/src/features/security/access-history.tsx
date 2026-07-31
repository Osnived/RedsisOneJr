import type { RoleAccessAuditEntry } from '@redsis/contracts';
import { DateTime } from '@/shared/components/ui/date-time';
import { Spinner } from '@/shared/components/ui/spinner';

interface AccessHistoryProps {
  entries: RoleAccessAuditEntry[];
  loading: boolean;
  roleName: string;
}

/**
 * Historial de cambios del rol seleccionado.
 *
 * Solo lectura: no se edita ni se elimina. Un historial que se puede corregir no
 * es un historial, y la trazabilidad es justo lo que este módulo aporta.
 *
 * Muestra quién, cuándo y por qué. El detalle de qué cambió está almacenado y no
 * se dibuja aquí todavía: el motivo es lo que se consulta cuando alguien pregunta
 * por un cambio.
 */
export function AccessHistory({
  entries,
  loading,
  roleName,
}: AccessHistoryProps): React.JSX.Element {
  return (
    <section aria-labelledby="historial-de-accesos" className="flex flex-col gap-3">
      <div>
        <h3 id="historial-de-accesos" className="text-sm font-medium">
          Historial
        </h3>
        <p className="text-xs text-muted-foreground">
          Cambios de acceso registrados para {roleName}. No se puede editar ni eliminar.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este rol no ha cambiado desde que se creó.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {/* Un usuario eliminado deja el cambio sin autor: se dice, en
                    lugar de dejar el hueco en blanco. */}
                <span className="font-medium">{entry.userName ?? 'Usuario eliminado'}</span>
                <DateTime value={entry.occurredAt} className="text-xs text-muted-foreground" />
              </div>

              <p className="mt-1 text-muted-foreground">{entry.reason}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
