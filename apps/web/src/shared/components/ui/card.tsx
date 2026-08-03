import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

type CardProps = ComponentProps<'div'> & {
  /**
   * Aplica el aspecto de tarjeta al hijo en lugar de envolverlo en un `div`.
   *
   * Hace falta cuando la tarjeta **es** una región con nombre —una sección de una
   * ficha, por ejemplo—: el elemento tiene que ser un `section` para que su título
   * la nombre, y sin esto habría que copiar las clases de la tarjeta.
   */
  asChild?: boolean;
};

export function Card({ className, asChild = false, ...props }: CardProps): React.JSX.Element {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      className={cn('rounded-lg border border-border bg-card text-card-foreground', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>): React.JSX.Element {
  return <h3 className={cn('text-lg font-semibold leading-none', className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>): React.JSX.Element {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}
