import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnOrderState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table,
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
import { useQueryChangeNotifier } from './use-query-change-notifier';
import { differsFromDefaults, resolveUpdater, selectRows } from './table-state';

interface UseDataTableOptions<TData> {
  tableId: string;
  columns: ColumnDefinition<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  rowActions?: (row: TData) => ReactNode;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  mode?: TableMode;
  totalRows?: number;
  onQueryChange?: (query: TableQuery) => void;
}

interface UseDataTableResult<TData> {
  table: Table<TData>;
  search: string;
  setSearch: (value: string) => void;
  /** Filas marcadas por el usuario, en el orden en que llegaron los datos. */
  selectedRows: TData[];
  clearSelection: () => void;
  resetPreferences: () => void;
  /** True cuando el usuario ha modificado algo respecto al estado inicial. */
  hasCustomPreferences: boolean;
}

/**
 * Motor del framework de tablas.
 *
 * Concentra toda la relación con TanStack Table: los componentes solo consumen
 * la instancia resultante.
 *
 * Todo el estado que el usuario puede modificar vive en las preferencias y se
 * persiste solo, a través de `useTablePreferences`. Este hook nunca toca
 * `localStorage` ni sabe dónde se guarda nada.
 */
export function useDataTable<TData>({
  tableId,
  columns,
  data,
  getRowId,
  rowActions,
  enableRowSelection = false,
  onRowSelectionChange,
  mode = 'client',
  totalRows,
  onQueryChange,
}: UseDataTableOptions<TData>): UseDataTableResult<TData> {
  const columnDefs = useMemo(
    () => buildColumnDefs(columns, rowActions, enableRowSelection),
    [columns, rowActions, enableRowSelection],
  );

  // La selección es transitoria: vive en memoria y no se persiste.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const defaults = useMemo<TablePreferences>(
    () => ({
      columnVisibility: buildInitialColumnVisibility(columns),
      columnOrder: [],
      columnSizing: buildInitialColumnSizing(columns),
      pageSize: DEFAULT_PAGE_SIZE,
      page: 1,
      sorting: [],
      search: '',
    }),
    [columns],
  );

  const { preferences, update, reset } = useTablePreferences(tableId, defaults);
  const isServerMode = mode === 'server';

  const sorting: SortingState = preferences.sorting;
  const columnOrder: ColumnOrderState = preferences.columnOrder;
  const pagination: PaginationState = {
    pageIndex: preferences.page - 1,
    pageSize: preferences.pageSize,
  };

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack devuelve funciones nuevas en cada render; es una limitación conocida de la librería que exige STACK.md.
  const table = useReactTable<TData>({
    data,
    columns: columnDefs,
    getRowId,
    state: {
      sorting,
      pagination,
      columnOrder,
      rowSelection,
      globalFilter: preferences.search,
      columnVisibility: preferences.columnVisibility,
      columnSizing: preferences.columnSizing,
    },
    onSortingChange: (updater) => {
      // Un orden nuevo invalida la página actual: la fila buscada ya no está ahí.
      update({ sorting: resolveUpdater(updater, sorting), page: 1 });
    },
    onPaginationChange: (updater) => {
      const next = resolveUpdater(updater, pagination);
      update({ page: next.pageIndex + 1, pageSize: next.pageSize });
    },
    onGlobalFilterChange: (updater) => {
      update({ search: resolveUpdater(updater, preferences.search), page: 1 });
    },
    onColumnVisibilityChange: (updater) => {
      update({ columnVisibility: resolveUpdater(updater, preferences.columnVisibility) });
    },
    onColumnOrderChange: (updater) => {
      update({ columnOrder: resolveUpdater(updater, columnOrder) });
    },
    onColumnSizingChange: (updater) => {
      update({ columnSizing: resolveUpdater(updater, preferences.columnSizing) });
    },
    onRowSelectionChange: (updater) => {
      const next = resolveUpdater(updater, rowSelection);
      setRowSelection(next);
      // Se avisa aquí y no desde un efecto para no provocar renders en cascada:
      // el estado nuevo ya se conoce en este punto.
      onRowSelectionChange?.(selectRows(data, getRowId, next));
    },
    enableRowSelection,
    columnResizeMode: 'onChange',
    // La página la gobiernan las preferencias: si TanStack la reiniciara al
    // cambiar los datos, borraría la página restaurada en la primera carga.
    autoResetPageIndex: false,
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
    query: {
      page: preferences.page,
      pageSize: preferences.pageSize,
      sorting,
      search: preferences.search,
    },
  });

  return {
    table,
    search: preferences.search,
    setSearch: (value: string) => {
      update({ search: value, page: 1 });
    },
    selectedRows: selectRows(data, getRowId, rowSelection),
    clearSelection: () => {
      setRowSelection({});
      onRowSelectionChange?.([]);
    },
    resetPreferences: reset,
    hasCustomPreferences: differsFromDefaults(preferences, defaults),
  };
}
