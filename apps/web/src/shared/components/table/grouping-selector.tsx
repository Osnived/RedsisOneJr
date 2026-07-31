import { Layers } from 'lucide-react';
import { useTableGrouping } from '@/shared/hooks/table/use-table-grouping';

const NO_GROUPING = '';

/**
 * Selector de agrupación.
 *
 * Ofrece únicamente las columnas que el módulo declaró agrupables: agrupar por
 * un campo con un valor distinto en cada fila daría un grupo por fila, así que
 * la decisión pertenece a quien conoce los datos.
 *
 * No aparece si el módulo no declaró ninguna, en lugar de mostrar un desplegable
 * vacío.
 */
export function GroupingSelector(): React.JSX.Element | null {
  const { groupableColumns, groupedColumnId, setGroupedColumn } = useTableGrouping();

  if (groupableColumns.length === 0) {
    return null;
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Agrupar por</span>
      <select
        value={groupedColumnId ?? NO_GROUPING}
        onChange={(event) =>
          setGroupedColumn(event.target.value === NO_GROUPING ? null : event.target.value)
        }
        aria-label="Agrupar por"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value={NO_GROUPING}>Sin agrupar</option>
        {groupableColumns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.label}
          </option>
        ))}
      </select>
    </label>
  );
}
