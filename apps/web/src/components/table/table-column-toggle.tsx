import { useState } from 'react';
import { Columns3 } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';

/**
 * Selector de columnas visibles.
 *
 * Solo lista las columnas declaradas ocultables: las imprescindibles y la de
 * acciones no aparecen, para que el usuario no pueda dejar la tabla sin
 * información útil ni sin acceso a las acciones.
 *
 * MVP 5 lo sustituirá por un ColumnSelector con búsqueda de columnas y
 * restauración; esta versión cubre lo mínimo mientras tanto.
 */
export function TableColumnToggle<TData>({
  table,
}: {
  table: Table<TData>;
}): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());

  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Columns3 aria-hidden="true" />
        Columnas
      </Button>

      {isOpen ? (
        <>
          {/* Capa que cierra el panel al pulsar fuera. */}
          <button
            type="button"
            aria-label="Cerrar selector de columnas"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="group"
            aria-label="Columnas visibles"
            className="absolute right-0 z-20 mt-1 flex w-56 flex-col gap-1 rounded-md border border-border bg-card p-2 shadow-lg"
          >
            {hideableColumns.map((column) => (
              <label
                key={column.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  name={column.id}
                  checked={column.getIsVisible()}
                  onChange={(event) => column.toggleVisibility(event.target.checked)}
                />
                {resolveColumnLabel(column.columnDef.header, column.id)}
              </label>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** La cabecera puede ser un nodo; en ese caso se cae al identificador. */
function resolveColumnLabel(header: unknown, fallback: string): string {
  return typeof header === 'string' ? header : fallback;
}
