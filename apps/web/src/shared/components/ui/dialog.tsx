import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Diálogo modal.
 *
 * Se apoya en Radix porque el comportamiento accesible de un modal (atrapar el
 * foco, devolverlo al cerrar, cerrar con Escape, marcar el resto de la página
 * como inerte) es difícil de implementar bien y fácil de implementar mal.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>): React.JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col',
          'rounded-lg border border-border bg-card shadow-lg',
          // En móvil ocupa el ancho disponible con un margen mínimo.
          'max-sm:max-w-[calc(100vw-2rem)]',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1 border-b border-border p-5', className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('flex-1 overflow-y-auto p-5', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}
