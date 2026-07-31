import type { ReactNode } from 'react';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/utils';

interface FormFieldProps {
  /** Debe coincidir con el `id` del control para que la etiqueta lo enfoque. */
  name: string;
  label: string;
  /** Mensaje de validación. Su presencia marca el campo como inválido. */
  error?: string | undefined;
  /** Aclaración de qué se espera, visible siempre. */
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Envoltura de un campo de formulario: etiqueta, control, ayuda y error.
 *
 * Concentra el cableado de accesibilidad —`aria-describedby`, el vínculo entre
 * etiqueta y control, el orden de lectura del error— para que ningún formulario
 * tenga que recordarlo. Es lo que hace que todos se comporten igual.
 */
export function FormField({
  name,
  label,
  error,
  hint,
  required = false,
  children,
  className,
}: FormFieldProps): React.JSX.Element {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Atributos de accesibilidad que corresponden a un control según su estado.
 *
 * Se expone como función para que cada control los reciba sin que el formulario
 * los escriba a mano y se olvide de alguno.
 */
export function fieldAccessibilityProps({
  name,
  error,
  hint,
}: {
  name: string;
  error?: string | undefined;
  hint?: string | undefined;
}): { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string } {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return {
    id: name,
    ...(error ? { 'aria-invalid': true as const } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  };
}
