import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Campo de texto de varias líneas.
 *
 * Mismo aspecto y mismo comportamiento de validación que `Input`: lo único que
 * cambia es que el contenido no cabe en una línea. Una observación de una
 * intervención o una descripción de un servicio no se escriben en un campo de
 * altura fija.
 */
export function Textarea({
  className,
  rows = 4,
  ...props
}: ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      rows={rows}
      className={cn(
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
