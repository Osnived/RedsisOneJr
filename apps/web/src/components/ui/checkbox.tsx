import { useEffect, useRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  /** Estado intermedio: hay selección parcial. */
  indeterminate?: boolean;
};

/**
 * Casilla de verificación.
 *
 * Existe como componente propio únicamente porque el estado intermedio no se
 * puede expresar con un atributo: hay que asignarlo por referencia. Encapsularlo
 * evita repetir ese detalle en cada sitio que necesite una selección parcial.
 */
export function Checkbox({
  indeterminate = false,
  className,
  ...props
}: CheckboxProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      className={cn('size-4 cursor-pointer accent-primary', className)}
      {...props}
    />
  );
}
