import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { DialogFooter } from '@/shared/components/ui/dialog';

interface FormFooterProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  /** Deshabilita el envío por razones del formulario, no por estar enviando. */
  isSubmitDisabled?: boolean;
}

/**
 * Pie de formulario con las acciones de guardar y cancelar.
 *
 * En móvil las acciones se apilan con la principal arriba (`flex-col-reverse`),
 * porque es la zona alcanzable con el pulgar.
 */
export function FormFooter({
  onCancel,
  isSubmitting,
  submitLabel = 'Guardar',
  submittingLabel = 'Guardando...',
  cancelLabel = 'Cancelar',
  isSubmitDisabled = false,
}: FormFooterProps): React.JSX.Element {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>

      <Button type="submit" disabled={isSubmitting || isSubmitDisabled}>
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </DialogFooter>
  );
}
