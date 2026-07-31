import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Menú contextual.
 *
 * Radix aporta la navegación con teclado, el cierre al pulsar fuera y el rol
 * accesible correcto (`menu` / `menuitem`), que un panel hecho a mano no tiene.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  align = 'end',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={4}
        className={cn(
          'z-50 min-w-44 rounded-md border border-border bg-card p-1 shadow-lg',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  /** Resalta la acción en rojo: usar solo para operaciones destructivas. */
  destructive?: boolean;
};

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: DropdownMenuItemProps): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm',
        'data-[highlighted]:bg-accent data-[highlighted]:outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive && 'text-destructive data-[highlighted]:bg-destructive/10',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-border', className)} {...props} />
  );
}
