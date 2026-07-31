import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-muted-foreground',
        info: 'border-primary/30 bg-primary/10 text-primary',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'border-destructive/30 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

/**
 * Etiqueta de estado reutilizable.
 *
 * Es infraestructura de interfaz, no de negocio: no conoce estados de tickets ni
 * de ningún módulo. Cada dominio decide qué variante usar para cada valor.
 */
export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
