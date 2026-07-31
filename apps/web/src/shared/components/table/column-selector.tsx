import { useMemo, useState } from 'react';
import { Columns3, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { COLUMN_SEARCH_THRESHOLD, filterColumnsByLabel } from '@/shared/lib/table/filter-columns';
import type { SelectableColumn } from '@/shared/types/table';
import { TableSearch } from './table-search';

export type { SelectableColumn };

interface ColumnSelectorProps {
  columns: SelectableColumn[];
  onToggle: (columnId: string, isVisible: boolean) => void;
  /** Devuelve la tabla a su configuración inicial. */
  onRestore?: () => void;
  /** Falso cuando no hay nada que restaurar. */
  canRestore?: boolean;
}

/**
 * Selector de columnas visibles.
 *
 * No conoce el motor de tablas ni el origen de almacenamiento: recibe una lista
 * plana y avisa de los cambios. Quien lo use decide dónde se guardan las
 * preferencias, y ese detalle nunca llega aquí. Por eso funciona igual con
 * `localStorage`, con el backend o sin persistencia alguna.
 *
 * Solo se listan las columnas ocultables. Las imprescindibles no aparecen porque
 * el usuario no puede actuar sobre ellas y mostrarlas deshabilitadas solo añade
 * ruido.
 */
export function ColumnSelector({
  columns,
  onToggle,
  onRestore,
  canRestore = true,
}: ColumnSelectorProps): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  /**
   * Al cerrar se descarta la búsqueda: al volver a abrir se espera ver la lista
   * completa, no el filtro de la vez anterior.
   *
   * Se hace al cerrar y no en un efecto que observe `isOpen`, porque llamar a
   * setState desde un efecto provoca renders en cascada.
   */
  function close(): void {
    setIsOpen(false);
    setSearch('');
  }

  const matchingColumns = useMemo(() => filterColumnsByLabel(columns, search), [columns, search]);

  if (columns.length === 0) {
    return null;
  }

  const visibleCount = columns.filter((column) => column.isVisible).length;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-haspopup="true"
        // El contador visual "1/6" no se entiende leído en voz alta, y el nombre
        // accesible derivado del marcado depende de espacios frágiles.
        aria-label={`Columnas, ${visibleCount} de ${columns.length} visibles`}
      >
        <Columns3 aria-hidden="true" />
        Columnas
        <span className="text-xs text-muted-foreground">
          {visibleCount}/{columns.length}
        </span>
      </Button>

      {isOpen ? (
        <>
          {/* Capa que cierra el panel al pulsar fuera. */}
          <button
            type="button"
            aria-label="Cerrar selector de columnas"
            className="fixed inset-0 z-10 cursor-default"
            onClick={close}
          />

          <div
            role="group"
            aria-label="Columnas visibles"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                close();
              }
            }}
            className="absolute right-0 z-20 mt-1 flex w-64 flex-col rounded-md border border-border bg-card shadow-lg"
          >
            {columns.length > COLUMN_SEARCH_THRESHOLD ? (
              <div className="border-b border-border p-2">
                <TableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar columna"
                  className="[&_input]:h-8"
                />
              </div>
            ) : null}

            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto p-2">
              {matchingColumns.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                  Ninguna columna coincide
                </p>
              ) : (
                matchingColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      name={column.id}
                      checked={column.isVisible}
                      onChange={(event) => onToggle(column.id, event.target.checked)}
                    />
                    {column.label}
                  </label>
                ))
              )}
            </div>

            {onRestore ? (
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  disabled={!canRestore}
                  onClick={() => {
                    onRestore();
                    close();
                  }}
                  title={
                    canRestore
                      ? 'Restaurar orden, columnas y tamaño de página'
                      : 'No hay ajustes que restaurar'
                  }
                >
                  <RotateCcw aria-hidden="true" />
                  Restaurar configuración
                </Button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
