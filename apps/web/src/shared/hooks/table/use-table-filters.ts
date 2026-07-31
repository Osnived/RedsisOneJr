import { createId } from '@/shared/lib/create-id';
import { toFilterText } from '@/shared/lib/table/apply-filters';
import { operatorNeedsValue, type AdvancedFilter, type FilterOperator } from '@/shared/types/table';
import { useTableContext } from './use-table-context';

/** Columna sobre la que se puede declarar una condición. */
export interface FilterableColumn {
  id: string;
  label: string;
  /** Valores presentes en los datos, para sugerirlos al escribir. */
  suggestions: string[];
}

interface UseTableFiltersResult {
  filters: AdvancedFilter[];
  filterableColumns: FilterableColumn[];
  /** Número de condiciones que de verdad están restringiendo el resultado. */
  activeCount: number;
  add: () => void;
  update: (filterId: string, changes: Partial<Omit<AdvancedFilter, 'id'>>) => void;
  remove: (filterId: string) => void;
  clear: () => void;
}

/** Cuántos valores distintos se sugieren como máximo. Más no caben ni ayudan. */
const MAX_SUGGESTIONS = 25;

/**
 * Constructor de filtros de una tabla.
 *
 * Las condiciones viven en las preferencias, así que sobreviven a una recarga y
 * una vista puede guardarlas sin que este hook sepa que las vistas existen.
 */
export function useTableFilters(): UseTableFiltersResult {
  const { table, preferences, updatePreferences } = useTableContext<unknown>();
  const filters = preferences.filters;

  const filterableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanFilter())
    .map((column) => ({
      id: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
      suggestions: distinctValues(
        table.getCoreRowModel().rows.map((row) => row.getValue(column.id)),
      ),
    }));

  function write(next: AdvancedFilter[]): void {
    // Cambiar las condiciones cambia el conjunto: la página anterior ya no
    // apunta a las mismas filas.
    updatePreferences({ filters: next, page: 1 });
  }

  return {
    filters,
    filterableColumns,
    activeCount: filters.filter(
      (filter) => !operatorNeedsValue(filter.operator) || filter.value.trim().length > 0,
    ).length,

    add: () => {
      const firstColumn = filterableColumns[0];

      if (!firstColumn) {
        return;
      }

      write([
        ...filters,
        { id: createId(), columnId: firstColumn.id, operator: 'contiene', value: '' },
      ]);
    },

    update: (filterId, changes) => {
      write(
        filters.map((filter) =>
          filter.id === filterId ? { ...filter, ...withCoherentValue(filter, changes) } : filter,
        ),
      );
    },

    remove: (filterId) => {
      write(filters.filter((filter) => filter.id !== filterId));
    },

    clear: () => {
      write([]);
    },
  };
}

/**
 * Cambiar a un operador sin valor descarta lo que hubiera escrito.
 *
 * Conservarlo dejaría un texto invisible que reaparecería al volver a un
 * operador con valor, y el usuario no sabría de dónde salió.
 */
function withCoherentValue(
  filter: AdvancedFilter,
  changes: Partial<Omit<AdvancedFilter, 'id'>>,
): Partial<AdvancedFilter> {
  const operator: FilterOperator = changes.operator ?? filter.operator;

  return operatorNeedsValue(operator) ? changes : { ...changes, value: '' };
}

function distinctValues(values: unknown[]): string[] {
  const seen = new Set<string>();

  for (const value of values) {
    const text = toFilterText(value);

    if (text.length > 0) {
      seen.add(text);
    }

    if (seen.size >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return [...seen].sort((first, second) => first.localeCompare(second, 'es'));
}
