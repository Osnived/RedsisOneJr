import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface TableSelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  /** Acciones masivas del módulo: asignar, exportar, cerrar en lote. */
  children?: ReactNode;
}

/**
 * Aviso de filas seleccionadas.
 *
 * Solo aparece cuando hay selección, para no ocupar espacio permanentemente.
 * No conoce el motor ni ningún módulo: recibe el conteo y una forma de limpiar.
 */
export function TableSelectionBar({
  selectedCount,
  onClear,
  children,
}: TableSelectionBarProps): React.JSX.Element | null {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      // `polite` y no `assertive`: informa sin interrumpir lo que el usuario esté haciendo.
      aria-live="polite"
      className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-3 py-2"
    >
      <span className="text-sm font-medium">
        {selectedCount === 1 ? '1 fila seleccionada' : `${selectedCount} filas seleccionadas`}
      </span>

      <Button variant="ghost" size="sm" onClick={onClear}>
        <X aria-hidden="true" />
        Limpiar selección
      </Button>

      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
