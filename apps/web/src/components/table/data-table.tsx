import { useDataTable } from '@/hooks/table/use-data-table';
import type { DataTableProps } from '@/types/table';
import { TableBody } from './table-body';
import { TableColumnToggle } from './table-column-toggle';
import { TableEmptyState } from './table-empty-state';
import { TableErrorState } from './table-error-state';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';
import { TableSkeleton } from './table-skeleton';
import { TableToolbar } from './table-toolbar';

/**
 * Tabla reutilizable de la plataforma.
 *
 * Es el único componente que los módulos necesitan usar: describen las columnas,
 * pasan los datos y el framework resuelve orden, búsqueda, paginación,
 * visibilidad de columnas, redimensionado y persistencia de preferencias.
 *
 * Su única responsabilidad es orquestar: elige qué estado mostrar y conecta el
 * motor con los componentes de presentación. No contiene lógica de ningún
 * módulo, así que añadir uno nuevo no requiere tocar este archivo.
 */
export function DataTable<TData>({
  tableId,
  columns,
  data,
  getRowId,
  loading = false,
  error = null,
  toolbar,
  rowActions,
  mode = 'client',
  totalRows,
  onQueryChange,
  emptyMessage,
  enableSearch = true,
  searchPlaceholder = 'Buscar...',
}: DataTableProps<TData>): React.JSX.Element {
  const { table, search, setSearch, resetPreferences, hasCustomPreferences } = useDataTable({
    tableId,
    columns,
    data,
    getRowId,
    mode,
    // Las opcionales solo se pasan cuando existen: con
    // `exactOptionalPropertyTypes` no es lo mismo omitirlas que enviar `undefined`.
    ...(rowActions === undefined ? {} : { rowActions }),
    ...(totalRows === undefined ? {} : { totalRows }),
    ...(onQueryChange === undefined ? {} : { onQueryChange }),
  });

  const columnCount = table.getVisibleLeafColumns().length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const rowsOnPage = table.getRowModel().rows.length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <TableToolbar
        {...(enableSearch
          ? { search: { value: search, onChange: setSearch, placeholder: searchPlaceholder } }
          : {})}
        columnSelector={<TableColumnToggle table={table} />}
        {...(hasCustomPreferences ? { onResetPreferences: resetPreferences } : {})}
      >
        {toolbar}
      </TableToolbar>

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

    return <TableBody table={table} />;
  }
}
