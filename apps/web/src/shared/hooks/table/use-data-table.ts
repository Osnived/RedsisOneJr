import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnOrderState,
  type ExpandedState,
  type GroupingState,
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
} from '@/shared/types/table';
import {
  buildColumnDefs,
  buildInitialColumnSizing,
  buildInitialColumnVisibility,
} from '@/shared/lib/table/column-adapter';
import { applyAdvancedFilters } from '@/shared/lib/table/apply-filters';
import { useTablePreferences } from './use-table-preferences';
import { useQueryChangeNotifier } from './use-query-change-notifier';
import { differsFromDefaults, resolveUpdater, selectRows } from './table-state';

export interface UseDataTableOptions<TData> {
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

export interface UseDataTableResult<TData> {
  /** Identificador de la tabla, para las capacidades que guardan datos propios. */
  tableId: string;
  table: Table<TData>;
  search: string;
  setSearch: (value: string) => void;
  /** Filas marcadas por el usuario, en el orden en que llegaron los datos. */
  selectedRows: TData[];
  clearSelection: () => void;
  resetPreferences: () => void;
  /** True cuando el usuario ha modificado algo respecto al estado inicial. */
  hasCustomPreferences: boolean;

  /**
   * Estado persistido de la tabla.
   *
   * Lo consumen las capacidades avanzadas —vistas, agrupación, filtros— que
   * necesitan leer y escribir el estado completo, no solo lo que expone la
   * instancia del motor. No es API pública de la plataforma.
   */
  preferences: TablePreferences;
  updatePreferences: (changes: Partial<TablePreferences>) => void;
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

  // Los grupos arrancan abiertos: agrupar y no ver nada obligaría a un clic por
  // grupo antes de que la tabla sirva para algo. Qué grupo está plegado es
  // transitorio, como la selección.
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const defaults = useMemo<TablePreferences>(
    () => ({
      columnVisibility: buildInitialColumnVisibility(columns),
      columnOrder: [],
      columnSizing: buildInitialColumnSizing(columns),
      pageSize: DEFAULT_PAGE_SIZE,
      page: 1,
      sorting: [],
      search: '',
      filters: [],
      grouping: [],
      activeViewId: null,
    }),
    [columns],
  );

  const { preferences, update, reset } = useTablePreferences(tableId, defaults);
  const isServerMode = mode === 'server';

  const sorting: SortingState = preferences.sorting;
  const columnOrder: ColumnOrderState = preferences.columnOrder;
  const grouping: GroupingState = preferences.grouping;
  const pagination: PaginationState = {
    pageIndex: preferences.page - 1,
    pageSize: preferences.pageSize,
  };

  // Los filtros avanzados se resuelven antes del motor: recibe los datos ya
  // filtrados y su paginación y sus recuentos salen correctos sin tocar nada
  // más. En modo servidor filtra el backend, así que aquí no se toca.
  const visibleData = useMemo(
    () => (isServerMode ? data : applyAdvancedFilters(data, preferences.filters, columns)),
    [isServerMode, data, preferences.filters, columns],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack devuelve funciones nuevas en cada render; es una limitación conocida de la librería que exige STACK.md.
  const table = useReactTable<TData>({
    data: visibleData,
    columns: columnDefs,
    getRowId,
    state: {
      sorting,
      pagination,
      columnOrder,
      rowSelection,
      grouping,
      expanded,
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
    onGroupingChange: (updater) => {
      // Agrupar reorganiza las filas por completo: la página anterior ya no
      // significa nada, y los grupos deben verse abiertos desde el principio.
      update({ grouping: resolveUpdater(updater, grouping), page: 1 });
      setExpanded(true);
    },
    onExpandedChange: (updater) => {
      setExpanded(resolveUpdater(updater, expanded));
    },
    onRowSelectionChange: (updater) => {
      const next = resolveUpdater(updater, rowSelection);
      setRowSelection(next);
      // Se avisa aquí y no desde un efecto para no provocar renders en cascada:
      // el estado nuevo ya se conoce en este punto.
      onRowSelectionChange?.(selectRows(visibleData, getRowId, next));
    },
    enableRowSelection,
    columnResizeMode: 'onChange',
    // La página la gobiernan las preferencias: si TanStack la reiniciara al
    // cambiar los datos, borraría la página restaurada en la primera carga.
    autoResetPageIndex: false,
    autoResetExpanded: false,
    getCoreRowModel: getCoreRowModel(),
    // En modo servidor el backend ya entrega los datos ordenados, filtrados y
    // paginados: aplicar los modelos del cliente los alteraría por segunda vez.
    getSortedRowModel: isServerMode ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServerMode ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServerMode ? undefined : getPaginationRowModel(),
    // Sin columnas agrupadas ambos modelos son un paso a través, así que una
    // tabla que no agrupa se comporta exactamente igual que antes de existir
    // esta capacidad.
    getGroupedRowModel: isServerMode ? undefined : getGroupedRowModel(),
    getExpandedRowModel: isServerMode ? undefined : getExpandedRowModel(),
    manualSorting: isServerMode,
    manualFiltering: isServerMode,
    manualPagination: isServerMode,
    manualGrouping: isServerMode,
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
      filters: preferences.filters,
    },
  });

  return {
    tableId,
    table,
    search: preferences.search,
    setSearch: (value: string) => {
      update({ search: value, page: 1 });
    },
    selectedRows: selectRows(visibleData, getRowId, rowSelection),
    clearSelection: () => {
      setRowSelection({});
      onRowSelectionChange?.([]);
    },
    resetPreferences: reset,
    hasCustomPreferences: differsFromDefaults(preferences, defaults),
    preferences,
    updatePreferences: update,
  };
}
