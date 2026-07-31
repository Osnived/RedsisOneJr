import { createContext, useContext } from 'react';
import type { SelectableColumn } from '@/shared/types/table';
import type { UseDataTableResult } from './use-data-table';

/**
 * Instancia de la tabla compartida por su subárbol.
 *
 * Un contexto de React no puede ser genérico, así que el valor viaja como
 * `unknown`. El tipo real se recupera en `useTableContext`, que es el único
 * punto del framework donde se afirma. `TableProvider` sí está tipado, de modo
 * que lo que entra siempre es el resultado del motor.
 */
export const TableContext = createContext<unknown>(null);

/**
 * Instancia de la tabla en la que está montado el componente.
 *
 * Falla de forma explícita fuera de un `TableProvider`: un control de tabla
 * colocado donde no hay tabla es un error de programación, no un caso a tolerar.
 */
export function useTableContext<TData>(): UseDataTableResult<TData> {
  const value = useContext(TableContext);

  if (value === null) {
    throw new Error('Este componente debe usarse dentro de un TableProvider.');
  }

  return value as UseDataTableResult<TData>;
}

/** Control de las columnas que el usuario puede mostrar u ocultar. */
export interface TableColumnSettings {
  /** Solo las ocultables. Las imprescindibles no se listan. */
  columns: SelectableColumn[];
  toggle: (columnId: string, isVisible: boolean) => void;
  /** Devuelve la tabla a su configuración inicial. */
  restore: () => void;
  /** Falso cuando no hay nada que restaurar. */
  canRestore: boolean;
}

/**
 * Traduce el motor a una lista plana de columnas.
 *
 * Es la frontera del framework: a partir de aquí ningún componente sabe que
 * existe TanStack ni dónde se guardan las preferencias. El desplegable de la
 * barra superior y el panel lateral consumen esta misma traducción, porque
 * duplicarla sería garantizar que acaben divergiendo.
 */
export function useTableColumnSettings(): TableColumnSettings {
  const { table, resetPreferences, hasCustomPreferences } = useTableContext<unknown>();

  return {
    columns: table
      .getAllLeafColumns()
      .filter((column) => column.getCanHide())
      .map((column) => ({
        id: column.id,
        label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
        isVisible: column.getIsVisible(),
      })),
    toggle: (columnId, isVisible) => {
      table.getColumn(columnId)?.toggleVisibility(isVisible);
    },
    restore: resetPreferences,
    canRestore: hasCustomPreferences,
  };
}
