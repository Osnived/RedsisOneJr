import type { ReactNode } from 'react';
import { Alert } from '@/shared/components/ui/alert';
import { DialogBody } from '@/shared/components/ui/dialog';
import { ApiError } from '@/shared/lib/api-client';
import { FormFooter } from './form-footer';

interface EntityFormProps {
  /** Handler ya envuelto por react-hook-form (`handleSubmit(...)`). */
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  /** Error de la operación de guardado, tal como lo devuelve la capa de datos. */
  error?: Error | null;
  submitLabel?: string;
  submittingLabel?: string;
  children: ReactNode;
}

/**
 * Cuerpo de un formulario de entidad: campos, error de guardado y pie de acciones.
 *
 * Concentra dos cosas que todo formulario necesita y que es fácil resolver de
 * forma distinta cada vez: dónde se muestra el error del servidor y cómo se
 * comportan los botones mientras se guarda.
 *
 * La validación de campos no vive aquí: la aporta react-hook-form con el esquema
 * Zod del contrato compartido, y cada campo muestra su mensaje.
 */
export function EntityForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error = null,
  submitLabel,
  submittingLabel,
  children,
}: EntityFormProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
      <DialogBody>
        <div className="flex flex-col gap-4">
          {error ? <Alert variant="destructive">{describeError(error)}</Alert> : null}
          {children}
        </div>
      </DialogBody>

      <FormFooter
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        {...(submitLabel === undefined ? {} : { submitLabel })}
        {...(submittingLabel === undefined ? {} : { submittingLabel })}
      />
    </form>
  );
}

/**
 * Mensaje presentable de un error de guardado.
 *
 * Los errores de la API ya traen un mensaje pensado para el usuario. Cualquier
 * otro fallo (red caída, respuesta ilegible) se resume sin exponer detalles
 * técnicos que no ayudan a quien lo lee.
 */
function describeError(error: Error): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'No se pudo completar la operación. Revisa tu conexión e intenta de nuevo.';
}
