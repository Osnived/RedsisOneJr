import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { TableSearch } from './table-search';

interface TableToolbarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /**
   * Selector de columnas. Llega como nodo porque necesita conocer el motor y la
   * barra no: así la barra sigue siendo un componente de presentación puro.
   */
  columnSelector?: ReactNode;
  /** Controles de las capacidades avanzadas, si la tabla las tiene. */
  advancedControls?: ReactNode;
  onResetPreferences?: () => void;
  /** Contenido propio del módulo: alta, exportación, filtros específicos. */
  children?: ReactNode;
}

/**
 * Barra superior de una tabla.
 *
 * Compone búsqueda, selector de columnas, restablecer ajustes y el contenido del
 * módulo. Todo es opcional: una tabla sin búsqueda ni columnas ocultables sigue
 * pudiendo usarla solo para sus propias acciones.
 *
 * No depende del motor de tablas ni de ningún módulo.
 */
export function TableToolbar({
  search,
  columnSelector,
  advancedControls,
  onResetPreferences,
  children,
}: TableToolbarProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      {search ? (
        <TableSearch
          value={search.value}
          onChange={search.onChange}
          {...(search.placeholder === undefined ? {} : { placeholder: search.placeholder })}
          className="sm:max-w-xs sm:flex-1"
        />
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        {onResetPreferences ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetPreferences}
            title="Restablecer orden, columnas y tamaño de página"
          >
            <RotateCcw aria-hidden="true" />
            Restablecer
          </Button>
        ) : null}

        {advancedControls}
        {columnSelector}
        {children}
      </div>
    </div>
  );
}
