import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface EntityModalProps {
  isOpen: boolean;
  /** Se invoca al cerrar por cualquier vía: botón, Escape o pulsar fuera. */
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Impide cerrar mientras hay una operación en curso. */
  isBlocked?: boolean;
}

/**
 * Contenedor modal para crear o editar una entidad.
 *
 * Es la envoltura que reutilizarán todos los formularios de la plataforma
 * (usuarios, clientes, sucursales, técnicos, tickets). No conoce ningún dominio:
 * recibe un título y el contenido.
 *
 * Mientras se está guardando no se puede cerrar: perder los datos a medio enviar
 * por un Escape accidental es peor que esperar un segundo.
 */
export function EntityModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  isBlocked = false,
}: EntityModalProps): React.JSX.Element {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isBlocked) {
          onClose();
        }
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (isBlocked) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isBlocked) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}
