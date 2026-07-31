import type { ColumnDef, RowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  ROW_ACTIONS_COLUMN_ID,
  ROW_SELECTION_COLUMN_ID,
  type ColumnAlignment,
  type ColumnDefinition,
} from '@/shared/types/table';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { formatCellValue } from './format-cell-value';

/**
 * Permite que la cabecera, la celda y la fila de grupo conozcan lo que declaró
 * la columna sin añadir un mapa paralelo de columnas.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align: ColumnAlignment;
    groupLabel?: (value: unknown) => string;
  }
}

/** Ancho de la columna de acciones. Cabe una fila de botones de icono. */
const ROW_ACTIONS_COLUMN_WIDTH = 96;

/**
 * Traduce las definiciones de columna del framework al formato que entiende
 * TanStack Table.
 *
 * Es el único punto donde el framework habla el idioma del motor. Sustituir
 * TanStack por otra librería significa reescribir este archivo, no las tablas
 * de cada módulo.
 */
export function buildColumnDefs<TData>(
  columns: ColumnDefinition<TData>[],
  rowActions?: (row: TData) => ReactNode,
  enableRowSelection = false,
): ColumnDef<TData, unknown>[] {
  const defs: ColumnDef<TData, unknown>[] = columns.map((column) => ({
    id: column.id,
    accessorFn: (row: TData) => column.accessor(row),
    header: column.header,
    enableSorting: column.sortable ?? true,
    // TanStack ordena de forma descendente en el primer clic cuando la columna
    // es numérica. Se fuerza ascendente siempre: en una plataforma con nueve
    // módulos, que una columna se comporte distinta según su tipo de dato
    // desconcierta más de lo que ayuda.
    sortDescFirst: false,
    enableHiding: column.hideable ?? true,
    enableResizing: column.resizable ?? true,
    enableGrouping: column.groupable ?? false,
    enableColumnFilter: column.filterable ?? true,
    size: column.width ?? DEFAULT_COLUMN_WIDTH,
    minSize: column.minWidth ?? MIN_COLUMN_WIDTH,
    cell: (context) =>
      column.cell ? column.cell(context.row.original) : formatCellValue(context.getValue()),
    meta: {
      align: column.align ?? 'left',
      ...(column.groupLabel === undefined ? {} : { groupLabel: column.groupLabel }),
    },
  }));

  if (rowActions) {
    defs.push(buildRowActionsColumn(rowActions));
  }

  // La casilla de selección va primero: es lo que el usuario busca cuando
  // quiere marcar filas, y ponerla al final obligaría a recorrer la tabla.
  if (enableRowSelection) {
    defs.unshift(buildRowSelectionColumn<TData>());
  }

  return defs;
}

/** Ancho de la columna de selección. Solo contiene una casilla. */
const ROW_SELECTION_COLUMN_WIDTH = 44;

/**
 * Columna de casillas de selección.
 *
 * La casilla de la cabecera marca las filas de la página actual, no todas las
 * existentes: en modo servidor el resto no está cargado, y en modo cliente
 * seleccionar en silencio registros que no se ven sorprende al usuario.
 */
function buildRowSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: ROW_SELECTION_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enableGlobalFilter: false,
    enableColumnFilter: false,
    size: ROW_SELECTION_COLUMN_WIDTH,
    minSize: ROW_SELECTION_COLUMN_WIDTH,
    meta: { align: 'center' },
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Seleccionar todas las filas de la página"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Seleccionar fila"
      />
    ),
  };
}

/**
 * Columna de acciones de fila.
 *
 * No se puede ordenar, ocultar ni redimensionar: no contiene datos, y dejar que
 * el usuario la esconda le quitaría el acceso a las acciones sin explicación.
 */
function buildRowActionsColumn<TData>(
  rowActions: (row: TData) => ReactNode,
): ColumnDef<TData, unknown> {
  return {
    id: ROW_ACTIONS_COLUMN_ID,
    header: '',
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enableGlobalFilter: false,
    enableColumnFilter: false,
    size: ROW_ACTIONS_COLUMN_WIDTH,
    minSize: ROW_ACTIONS_COLUMN_WIDTH,
    cell: (context) => rowActions(context.row.original),
    meta: { align: 'right' },
  };
}

/**
 * Visibilidad inicial derivada de las columnas.
 *
 * TanStack considera visible toda columna que no aparezca en el mapa, así que
 * solo se declaran las que arrancan ocultas.
 */
export function buildInitialColumnVisibility<TData>(
  columns: ColumnDefinition<TData>[],
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};

  for (const column of columns) {
    if (column.hiddenByDefault) {
      visibility[column.id] = false;
    }
  }

  return visibility;
}

/** Ancho inicial de cada columna que declara uno explícito. */
export function buildInitialColumnSizing<TData>(
  columns: ColumnDefinition<TData>[],
): Record<string, number> {
  const sizing: Record<string, number> = {};

  for (const column of columns) {
    if (column.width !== undefined) {
      sizing[column.id] = column.width;
    }
  }

  return sizing;
}
