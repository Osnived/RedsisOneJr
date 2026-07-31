import { useTableColumnSettings, useTableContext } from '@/shared/hooks/table/use-table-context';
import type { DataTableViewProps } from '@/shared/types/table';
import { ColumnSelector } from './column-selector';
import { TableBody } from './table-body';
import { TableEmptyState } from './table-empty-state';
import { TableErrorState } from './table-error-state';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';
import { TableSelectionBar } from './table-selection-bar';
import { TableSkeleton } from './table-skeleton';
import { TableToolbar } from './table-toolbar';

/**
 * Cuerpo visual de una tabla ya montada sobre un `TableProvider`.
 *
 * Su única responsabilidad es orquestar: elige qué estado mostrar y traduce el
 * motor a las propiedades planas que esperan los componentes de presentación.
 * No contiene lógica de ningún módulo, así que añadir uno nuevo no requiere
 * tocar este archivo.
 *
 * No es genérico porque no necesita serlo: solo lee del motor, nunca construye
 * ni devuelve filas. Eso permite que cualquier envoltorio lo use sin arrastrar
 * el parámetro de tipo.
 */
export function DataTableView({
  loading = false,
  error = null,
  toolbar,
  emptyMessage,
  enableSearch = true,
  searchPlaceholder = 'Buscar...',
  columnControls,
  advancedControls,
}: DataTableViewProps): React.JSX.Element {
  const { table, rowNavigation, search, setSearch, selectedRows, clearSelection } =
    useTableContext<unknown>();

  const columnCount = table.getVisibleLeafColumns().length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const rows = table.getRowModel().rows;
  const rowsOnPage = rows.length;
  const summary = groupedSummary(rows);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <TableToolbar
        {...(enableSearch
          ? { search: { value: search, onChange: setSearch, placeholder: searchPlaceholder } }
          : {})}
        columnSelector={columnControls ?? <ToolbarColumnSelector />}
        {...(advancedControls === undefined ? {} : { advancedControls })}
      >
        {toolbar}
      </TableToolbar>

      <TableSelectionBar selectedCount={selectedRows.length} onClear={clearSelection} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: table.getTotalSize() }}>
          <TableHeader table={table} />
          {renderBody()}
        </table>
      </div>

      <TablePagination
        page={pageIndex + 1}
        pageCount={table.getPageCount()}
        pageSize={pageSize}
        totalRows={table.getRowCount()}
        rowsOnPage={rowsOnPage}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(size) => table.setPageSize(size)}
        {...(summary === null ? {} : { summary })}
      />
    </div>
  );

  /**
   * El orden importa: un error se muestra aunque haya datos antiguos en pantalla,
   * y la carga tiene prioridad sobre el mensaje de vacío para no afirmar que no
   * hay registros antes de saberlo.
   */
  function renderBody(): React.JSX.Element {
    if (loading) {
      return <TableSkeleton columnCount={columnCount} rowCount={Math.min(pageSize, 5)} />;
    }

    if (error) {
      return <TableErrorState columnCount={columnCount} message={error.message} />;
    }

    if (rowsOnPage === 0) {
      return (
        <TableEmptyState
          columnCount={columnCount}
          {...(emptyMessage === undefined ? {} : { message: emptyMessage })}
        />
      );
    }

    return <TableBody table={table} rowNavigation={rowNavigation} />;
  }
}

/**
 * Resumen de la página cuando la tabla está agrupada.
 *
 * Con grupos, las cabeceras también son filas: el rango habitual diría "1–7 de
 * 7" habiendo cuatro registros. Se cuenta lo que el usuario reconoce —registros
 * y grupos— y se devuelve null cuando no hay agrupación, para que la tabla siga
 * informando del rango de siempre.
 */
function groupedSummary(
  rows: { getIsGrouped: () => boolean; subRows: unknown[] }[],
): string | null {
  const groups = rows.filter((row) => row.getIsGrouped());

  if (groups.length === 0) {
    return null;
  }

  const records = groups.reduce((total, group) => total + group.subRows.length, 0);
  const recordText = records === 1 ? '1 registro' : `${records.toLocaleString('es')} registros`;
  const groupText = groups.length === 1 ? '1 grupo' : `${groups.length} grupos`;

  return `${recordText} en ${groupText}`;
}

/**
 * Selector de columnas por defecto de la barra superior.
 *
 * Es un componente y no una expresión dentro de la vista para que consultar el
 * contexto solo ocurra cuando de verdad se dibuja: la tabla avanzada lo
 * sustituye por el botón que abre su panel lateral.
 */
function ToolbarColumnSelector(): React.JSX.Element {
  const { columns, toggle, restore, canRestore } = useTableColumnSettings();

  return (
    <ColumnSelector
      columns={columns}
      onToggle={toggle}
      onRestore={restore}
      canRestore={canRestore}
    />
  );
}
