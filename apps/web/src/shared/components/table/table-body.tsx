import { ChevronDown, ChevronRight } from 'lucide-react';
import { flexRender, type Row, type Table } from '@tanstack/react-table';
import { cn } from '@/shared/lib/utils';
import { formatCellValue } from '@/shared/lib/table/format-cell-value';
import type { RowNavigation } from '@/shared/types/table';
import { ALIGNMENT_CLASS } from './alignment';

const ROW_CLASS = 'border-b border-border/50 last:border-0 hover:bg-muted/40';

/**
 * Filas de la tabla.
 *
 * Solo dibuja filas. Los estados de carga, error y vacío son componentes
 * propios y los elige el orquestador: así este componente tiene una sola
 * responsabilidad y no acumula condicionales.
 *
 * Cuando la tabla está agrupada aparecen filas de grupo entre las de datos. Sin
 * agrupación no existe ninguna, así que una tabla que no agrupa se dibuja
 * exactamente igual que antes de que esta capacidad existiera.
 */
export function TableBody<TData>({
  table,
  rowNavigation = null,
}: {
  table: Table<TData>;
  /** Null cuando las filas del módulo no llevan a ninguna pantalla. */
  rowNavigation?: RowNavigation<TData> | null;
}): React.JSX.Element {
  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <tbody>
      {table
        .getRowModel()
        .rows.map((row) =>
          row.getIsGrouped() ? (
            <GroupRow key={row.id} row={row} columnCount={columnCount} />
          ) : (
            <DataRow key={row.id} row={row} rowNavigation={rowNavigation} />
          ),
        )}
    </tbody>
  );
}

/**
 * Fila de datos.
 *
 * Cuando el módulo declara navegación, la fila entera es el acceso al registro.
 * Se hace sobre la propia `tr` y no con un enlace dentro de una celda porque el
 * destino es la fila completa: obligar a acertar en una celda concreta convierte
 * un gesto natural en un objetivo pequeño, y en un móvil eso se nota.
 *
 * A cambio hay que reponer a mano lo que un botón trae de serie: foco, teclado y
 * nombre accesible. Sin navegación la fila se dibuja exactamente como antes.
 */
function DataRow<TData>({
  row,
  rowNavigation,
}: {
  row: Row<TData>;
  rowNavigation: RowNavigation<TData> | null;
}): React.JSX.Element {
  const cells = row.getVisibleCells().map((cell) => (
    <td
      key={cell.id}
      style={{ width: cell.column.getSize() }}
      className={cn(
        'truncate px-3 py-2 text-sm',
        ALIGNMENT_CLASS[cell.column.columnDef.meta?.align ?? 'left'],
      )}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  ));

  if (rowNavigation === null) {
    return <tr className={ROW_CLASS}>{cells}</tr>;
  }

  return (
    <tr
      tabIndex={0}
      aria-label={rowNavigation.label(row.original)}
      onClick={(event) => {
        if (!isOwnControl(event.target)) {
          rowNavigation.onSelect(row.original);
        }
      }}
      onKeyDown={(event) => {
        if ((event.key !== 'Enter' && event.key !== ' ') || isOwnControl(event.target)) {
          return;
        }

        // Sin esto, el espacio desplazaría la página además de abrir la fila.
        event.preventDefault();
        rowNavigation.onSelect(row.original);
      }}
      className={cn(
        ROW_CLASS,
        'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
      )}
    >
      {cells}
    </tr>
  );
}

/**
 * Distingue un gesto dirigido a un control de dentro de la fila.
 *
 * La casilla de selección y el menú de acciones viven dentro de la propia fila:
 * sin esta comprobación, marcar un registro lo abriría también. Se resuelve aquí,
 * en un solo sitio, en lugar de exigir que cada celda que dibuje un control se
 * acuerde de detener la propagación.
 */
function isOwnControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('a, button, input, label, select, textarea, [role="menuitem"]') !== null
  );
}

/**
 * Cabecera de un grupo.
 *
 * Ocupa toda la anchura porque un grupo no describe una columna, sino el
 * conjunto de filas que vienen debajo. Muestra el recuento para que plegarlo no
 * esconda cuánto hay dentro.
 */
function GroupRow<TData>({
  row,
  columnCount,
}: {
  row: Row<TData>;
  columnCount: number;
}): React.JSX.Element {
  const isExpanded = row.getIsExpanded();
  const label = groupLabel(row);
  const count =
    row.subRows.length === 1
      ? '1 registro'
      : `${row.subRows.length.toLocaleString('es')} registros`;

  return (
    <tr className="border-b border-border bg-muted/60">
      <td colSpan={columnCount} className="px-3 py-1.5">
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={isExpanded}
          // El nombre se declara en lugar de derivarlo del marcado: el valor del
          // grupo puede coincidir con el de una cabecera, y "Grupo" delante deja
          // claro sobre qué actúa el botón.
          aria-label={`Grupo ${label}, ${count}`}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary"
        >
          {isExpanded ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
          {label}
          <span className="text-xs font-normal text-muted-foreground">{count}</span>
        </button>
      </td>
    </tr>
  );
}

/**
 * Texto del grupo.
 *
 * Se pide la etiqueta a la columna cuando la declaró, porque el accesor puede
 * devolver un código que al usuario no le dice nada.
 */
function groupLabel<TData>(row: Row<TData>): string {
  const value = row.getGroupingValue(row.groupingColumnId ?? '');
  const column = row.groupingColumnId
    ? row.getAllCells().find((cell) => cell.column.id === row.groupingColumnId)?.column
    : undefined;

  const toLabel = column?.columnDef.meta?.groupLabel;

  return toLabel ? toLabel(value) : formatCellValue(value);
}
