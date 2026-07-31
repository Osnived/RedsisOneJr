import { useTableContext } from './use-table-context';

/** Columna por la que se puede agrupar. */
export interface GroupableColumn {
  id: string;
  label: string;
}

interface UseTableGroupingResult {
  /** Columnas que su módulo declaró agrupables. Vacío si ninguna lo es. */
  groupableColumns: GroupableColumn[];
  /** Columna activa, o null si la tabla no está agrupada. */
  groupedColumnId: string | null;
  /** Agrupa por una columna, o deshace la agrupación con null. */
  setGroupedColumn: (columnId: string | null) => void;
}

/**
 * Agrupación de una tabla.
 *
 * Se expone una sola columna y no una lista aunque el motor admita varios
 * niveles: agrupar por un criterio es lo que se pidió, y una interfaz de
 * múltiples niveles que nadie ha especificado sería adivinar. El estado sigue
 * siendo una lista, así que añadir niveles después no rompe lo guardado.
 */
export function useTableGrouping(): UseTableGroupingResult {
  const { table, preferences } = useTableContext<unknown>();

  const groupableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanGroup())
    .map((column) => ({
      id: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
    }));

  return {
    groupableColumns,
    groupedColumnId: preferences.grouping[0] ?? null,
    setGroupedColumn: (columnId) => {
      table.setGrouping(columnId === null ? [] : [columnId]);
    },
  };
}
