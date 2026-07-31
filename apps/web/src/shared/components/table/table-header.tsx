import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { flexRender, type Table } from '@tanstack/react-table';
import { cn } from '@/shared/lib/utils';
import { ALIGNMENT_CLASS } from './alignment';

/**
 * Cabecera con ordenamiento y redimensionado.
 *
 * Junto con el cuerpo, es uno de los dos únicos componentes que conocen el
 * motor: son los que renderizan su salida.
 *
 * El control de redimensionado es un elemento aparte del botón de ordenar para
 * que arrastrar el borde no dispare el orden por accidente.
 */
export function TableHeader<TData>({ table }: { table: Table<TData> }): React.JSX.Element {
  return (
    <thead className="bg-muted/50">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const sortDirection = header.column.getIsSorted();

            return (
              <th
                key={header.id}
                scope="col"
                style={{ width: header.getSize() }}
                aria-sort={toAriaSort(sortDirection)}
                className={cn(
                  'relative border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground',
                  ALIGNMENT_CLASS[header.column.columnDef.meta?.align ?? 'left'],
                )}
              >
                {header.column.getCanSort() ? (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon direction={sortDirection} />
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}

                {header.column.getCanResize() ? (
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Redimensionar columna ${header.column.id}`}
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                      'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                      header.column.getIsResizing() ? 'bg-primary' : 'hover:bg-border',
                    )}
                  />
                ) : null}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }): React.JSX.Element {
  if (direction === 'asc') {
    return <ArrowUp className="size-3" aria-hidden="true" />;
  }

  if (direction === 'desc') {
    return <ArrowDown className="size-3" aria-hidden="true" />;
  }

  return <ChevronsUpDown className="size-3 opacity-40" aria-hidden="true" />;
}

function toAriaSort(direction: false | 'asc' | 'desc'): 'ascending' | 'descending' | 'none' {
  if (direction === 'asc') {
    return 'ascending';
  }

  return direction === 'desc' ? 'descending' : 'none';
}
