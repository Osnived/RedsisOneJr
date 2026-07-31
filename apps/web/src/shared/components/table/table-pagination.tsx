import { PAGE_SIZE_OPTIONS } from '@/shared/types/table';
import { Button } from '@/shared/components/ui/button';

interface TablePaginationProps {
  /** Página actual en base 1. */
  page: number;
  pageCount: number;
  pageSize: number;
  /** Total de registros existentes, no los de la página. */
  totalRows: number;
  /** Filas realmente mostradas en la página actual. */
  rowsOnPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];

  /**
   * Sustituye el rango de filas.
   *
   * Se usa cuando contar filas no describe lo que el usuario ve: con la tabla
   * agrupada, las cabeceras de grupo también son filas, y decir "1–7 de 7"
   * cuando hay cuatro registros es falso.
   */
  summary?: string;
}

/**
 * Controles de paginación.
 *
 * Recibe valores primitivos en lugar de la instancia del motor, así que sirve
 * igual en modo cliente que en modo servidor y no depende de TanStack Table.
 * Los límites se deducen aquí para que no puedan llegar en un estado incoherente.
 */
export function TablePagination({
  page,
  pageCount,
  pageSize,
  totalRows,
  rowsOnPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  summary,
}: TablePaginationProps): React.JSX.Element {
  const canGoPrevious = page > 1;
  const canGoNext = page < pageCount;

  // El rango se calcula sobre las filas realmente mostradas: en modo servidor el
  // backend puede devolver menos de las pedidas, y en modo cliente la última
  // página casi siempre está incompleta.
  const firstRow = rowsOnPage === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = rowsOnPage === 0 ? 0 : firstRow + rowsOnPage - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {rowsOnPage === 0
          ? 'Sin registros'
          : (summary ?? `Mostrando ${firstRow}–${lastRow} de ${totalRows.toLocaleString('es')}`)}
      </p>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Filas
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
          >
            Anterior
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            {pageCount === 0 ? '0 de 0' : `${page} de ${pageCount}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
