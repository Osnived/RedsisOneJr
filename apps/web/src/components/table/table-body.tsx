import { flexRender, type Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { ALIGNMENT_CLASS } from './alignment';

/**
 * Filas de la tabla.
 *
 * Solo dibuja filas. Los estados de carga, error y vacío son componentes
 * propios y los elige el orquestador: así este componente tiene una sola
 * responsabilidad y no acumula condicionales.
 */
export function TableBody<TData>({ table }: { table: Table<TData> }): React.JSX.Element {
  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
          {row.getVisibleCells().map((cell) => (
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
          ))}
        </tr>
      ))}
    </tbody>
  );
}
