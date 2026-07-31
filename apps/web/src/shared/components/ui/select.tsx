import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Desplegable de selección única.
 *
 * Se usa Radix y no un `<select>` nativo porque el nativo no se puede estilar de
 * forma consistente entre navegadores ni admite contenido enriquecido en las
 * opciones. Radix conserva la navegación con teclado y el anuncio accesible.
 */
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>): React.JSX.Element {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
        'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 opacity-50" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>): React.JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        // `popper` evita que el desplegable tape al disparador dentro de un modal.
        position="popper"
        sideOffset={4}
        className={cn(
          'z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-y-auto',
          'rounded-md border border-border bg-card p-1 shadow-lg',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>): React.JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 pr-8 text-sm',
        'data-[highlighted]:bg-accent data-[highlighted]:outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
