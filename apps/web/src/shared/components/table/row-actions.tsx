import { MoreVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

/**
 * Acción disponible sobre una fila.
 *
 * La declara la feature, nunca el framework: el DataTable no sabe qué significa
 * "suspender" ni quién puede hacerlo.
 */
export interface RowAction<TData> {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: (row: TData) => void;

  /**
   * Oculta la acción para esta fila concreta. Se usa para permisos y para
   * estados: no se ofrece "Suspender" a quien ya está suspendido.
   */
  isHidden?: (row: TData) => boolean;

  /** Muestra la acción deshabilitada en lugar de ocultarla. */
  isDisabled?: (row: TData) => boolean;

  /** Resalta la acción como destructiva. */
  destructive?: boolean;

  /** Dibuja un separador encima. Sirve para aislar lo irreversible. */
  separatorBefore?: boolean;
}

interface RowActionsProps<TData> {
  row: TData;
  actions: RowAction<TData>[];
  /** Texto accesible del botón. Conviene incluir algo que identifique la fila. */
  label?: string;
}

/**
 * Menú de acciones de una fila.
 *
 * El framework solo dibuja: recibe la lista de acciones y las presenta. Toda la
 * lógica —qué hace cada una, quién puede verla, cuándo aplica— pertenece a la
 * feature que las declara.
 *
 * Si ninguna acción es visible para la fila, no se dibuja el botón: un menú
 * vacío es peor que la ausencia de menú.
 */
export function RowActions<TData>({
  row,
  actions,
  label = 'Acciones de la fila',
}: RowActionsProps<TData>): React.JSX.Element | null {
  const visibleActions = actions.filter((action) => !action.isHidden?.(row));

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className="size-8">
          <MoreVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {visibleActions.map((action) => (
          <ActionItem key={action.id} action={action} row={row} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionItem<TData>({
  action,
  row,
}: {
  action: RowAction<TData>;
  row: TData;
}): React.JSX.Element {
  const item = (
    <DropdownMenuItem
      destructive={action.destructive ?? false}
      disabled={action.isDisabled?.(row) ?? false}
      onSelect={() => action.onSelect(row)}
    >
      {action.icon ? <action.icon className="size-4" aria-hidden="true" /> : null}
      {action.label}
    </DropdownMenuItem>
  );

  if (!action.separatorBefore) {
    return item;
  }

  return (
    <>
      <DropdownMenuSeparator />
      {item}
    </>
  );
}
