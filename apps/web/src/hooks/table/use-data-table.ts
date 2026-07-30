import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnSizingState,
  type PaginationState,
  type SortingState,
  type Table,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import {
  DEFAULT_PAGE_SIZE,
  type ColumnDefinition,
  type TableMode,
  type TablePreferences,
  type TableQuery,
} from '@/types/table';
import {
  buildColumnDefs,
  buildInitialColumnSizing,
  buildInitialColumnVisibility,
} from '@/lib/table/column-adapter';
import { useTablePreferences } from './use-table-preferences';

interface UseDataTableOptions<TData> {
  tableId: string;
  columns: ColumnDefinition<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  rowActions?: (row: TData) => ReactNode;
  mode?: TableMode;
  totalRows?: number;
  onQueryChange?: (query: TableQuery) => void;
}

interface UseDataTableResult<TData> {
  table: Table<TData>;
  search: string;
  setSearch: (value: string) => void;
  resetPreferences: () => void;
  /** True cuando el usuario ha modificado orden, columnas o tamaño de página. */
  hasCustomPreferences: boolean;
}

/**
 * Motor del framework de tablas.
 *
 * Concentra toda la relación con TanStack Table: los componentes solo consumen
 * la instancia resultante. Los ajustes que el usuario espera conservar viven en
 * las preferencias y se persisten solos; la búsqueda y la página actual son
 * transitorias a propósito.
 */
export function useDataTable<TData>({
  tableId,
  columns,
  data,
  getRowId,
  rowActions,
  mode = 'client',
  totalRows,
  onQueryChange,
}: UseDataTableOptions<TData>): UseDataTableResult<TData> {
  const columnDefs = useMemo(() => buildColumnDefs(columns, rowActions), [columns, rowActions]);

  const defaults = useMemo<TablePreferences>(
    () => ({
      columnVisibility: buildInitialColumnVisibility(columns),
      columnSizing: buildInitialColumnSizing(columns),
      pageSize: DEFAULT_PAGE_SIZE,
      sorting: [],
    }),
    [columns],
  );

  const { preferences, update, reset } = useTablePreferences(tableId, defaults);
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const isServerMode = mode === 'server';

  const sorting: SortingState = preferences.sorting;
  const pagination: PaginationState = { pageIndex, pageSize: preferences.pageSize };

  // React Compiler no puede memoizar la instancia porque TanStack devuelve
  // funciones nuevas en cada render. Es una limitación conocida de la librería
  // que exige STACK.md, no un descuido: la instancia se consume aquí mismo y
  // nunca se pasa a componentes memoizados.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns: columnDefs,
    getRowId,
    state: {
      sorting,
      pagination,
      globalFilter: search,
      columnVisibility: preferences.columnVisibility,
      columnSizing: preferences.columnSizing,
    },
    onSortingChange: (updater) => {
      update({ sorting: resolveUpdater(updater, sorting) });
      // Un orden nuevo invalida la página actual: la fila buscada ya no está ahí.
      setPageIndex(0);
    },
    onPaginationChange: (updater) => {
      const next = resolveUpdater(updater, pagination);
      setPageIndex(next.pageIndex);

      if (next.pageSize !== preferences.pageSize) {
        update({ pageSize: next.pageSize });
      }
    },
    onGlobalFilterChange: (updater) => {
      setSearch(resolveUpdater(updater, search));
      setPageIndex(0);
    },
    onColumnVisibilityChange: (updater) => {
      update({ columnVisibility: resolveUpdater(updater, preferences.columnVisibility) });
    },
    onColumnSizingChange: (updater) => {
      update({ columnSizing: resolveUpdater(updater, preferences.columnSizing) });
    },
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    // En modo servidor el backend ya entrega los datos ordenados, filtrados y
    // paginados: aplicar los modelos del cliente los alteraría por segunda vez.
    getSortedRowModel: isServerMode ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServerMode ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServerMode ? undefined : getPaginationRowModel(),
    manualSorting: isServerMode,
    manualFiltering: isServerMode,
    manualPagination: isServerMode,
    rowCount: isServerMode ? (totalRows ?? 0) : undefined,
  });

  useQueryChangeNotifier({
    enabled: isServerMode,
    onQueryChange,
    query: { page: pageIndex + 1, pageSize: preferences.pageSize, sorting, search },
  });

  const hasCustomPreferences =
    preferences.sorting.length > 0 ||
    preferences.pageSize !== defaults.pageSize ||
    !areRecordsEqual(preferences.columnVisibility, defaults.columnVisibility) ||
    !areRecordsEqual(preferences.columnSizing, defaults.columnSizing);

  return {
    table,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPageIndex(0);
    },
    resetPreferences: () => {
      reset();
      setPageIndex(0);
    },
    hasCustomPreferences,
  };
}

/**
 * Avisa al consumidor cuando cambia la consulta, solo en modo servidor.
 *
 * Se compara la consulta serializada para no disparar una petición por cada
 * render: sin esto, la identidad del objeto bastaría para pedir los mismos datos
 * en bucle.
 */
function useQueryChangeNotifier({
  enabled,
  query,
  onQueryChange,
}: {
  enabled: boolean;
  query: TableQuery;
  onQueryChange?: (query: TableQuery) => void;
}): void {
  const serialized = JSON.stringify(query);
  const lastSerialized = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !onQueryChange || lastSerialized.current === serialized) {
      return;
    }

    lastSerialized.current = serialized;
    onQueryChange(JSON.parse(serialized) as TableQuery);
  }, [enabled, onQueryChange, serialized]);
}

/** TanStack entrega el valor nuevo o una función que lo calcula. */
function resolveUpdater<TValue>(updater: Updater<TValue>, current: TValue): TValue {
  return typeof updater === 'function'
    ? (updater as (previous: TValue) => TValue)(current)
    : updater;
}

function areRecordsEqual(
  left: Record<string, boolean | number>,
  right: Record<string, boolean | number>,
): boolean {
  const leftKeys = Object.keys(left);

  if (leftKeys.length !== Object.keys(right).length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export type { ColumnSizingState, SortingState, VisibilityState };
