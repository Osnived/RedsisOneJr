import { useMemo, useState } from 'react';
import { Columns3, RotateCcw, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useTableColumnSettings } from '@/shared/hooks/table/use-table-context';
import { COLUMN_SEARCH_THRESHOLD, filterColumnsByLabel } from '@/shared/lib/table/filter-columns';
import { TableSearch } from './table-search';

interface ColumnSettingsPanelProps {
  onClose: () => void;
}

/**
 * Panel lateral de configuración de columnas.
 *
 * Muestra, oculta y restaura. Nada más: reordenar es una capacidad distinta y
 * todavía no está decidida.
 *
 * No recibe las columnas por propiedades: las lee del contexto de la tabla junto
 * a la que se dibuja. Por eso funciona igual para Tickets que para cualquier
 * módulo futuro sin que ninguna pantalla tenga que cablear nada.
 *
 * Es un panel y no un desplegable porque configurar columnas se hace mirando la
 * tabla: hay que ver el efecto de cada cambio sin que el control tape las filas.
 */
export function ColumnSettingsPanel({ onClose }: ColumnSettingsPanelProps): React.JSX.Element {
  const { columns, toggle, restore, canRestore } = useTableColumnSettings();
  const [search, setSearch] = useState('');

  const matchingColumns = useMemo(() => filterColumnsByLabel(columns, search), [columns, search]);
  const visibleCount = columns.filter((column) => column.isVisible).length;

  return (
    <aside
      aria-label="Configuración de columnas"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      className="flex w-64 shrink-0 flex-col self-start rounded-lg border border-border bg-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Columns3 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <h2 className="truncate text-sm font-medium">Columnas</h2>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar panel de columnas">
          <X aria-hidden="true" />
        </Button>
      </div>

      <p className="px-3 pt-2 text-xs text-muted-foreground">
        {visibleCount} de {columns.length} visibles
      </p>

      {columns.length > COLUMN_SEARCH_THRESHOLD ? (
        <div className="px-3 pt-2">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar columna"
            className="[&_input]:h-8"
          />
        </div>
      ) : null}

      <div className="flex max-h-96 flex-col gap-1 overflow-y-auto p-2">
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
              <Checkbox
                name={column.id}
                checked={column.isVisible}
                onChange={(event) => toggle(column.id, event.target.checked)}
              />
              <span className="truncate">{column.label}</span>
            </label>
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          disabled={!canRestore}
          onClick={restore}
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
    </aside>
  );
}

interface ColumnSettingsTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Botón que abre y cierra el panel.
 *
 * Ocupa el sitio del desplegable de columnas del BaseTable en lugar de sumarse
 * a él: dos controles distintos para lo mismo obligarían al usuario a averiguar
 * en qué se diferencian.
 */
export function ColumnSettingsTrigger({
  isOpen,
  onToggle,
}: ColumnSettingsTriggerProps): React.JSX.Element | null {
  const { columns } = useTableColumnSettings();

  if (columns.length === 0) {
    return null;
  }

  const visibleCount = columns.filter((column) => column.isVisible).length;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-expanded={isOpen}
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
  );
}
