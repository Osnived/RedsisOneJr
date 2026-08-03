import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Marca visual para un valor ausente.
 *
 * Coincide con la de las celdas de tabla a propósito: un hueco vacío se confunde
 * con un fallo de carga, y el mismo dato ausente debe verse igual en una tabla y
 * en una ficha.
 */
export const EMPTY_VALUE = '—';

/**
 * Lista de campos de solo lectura.
 *
 * Es el equivalente de `FormField` para lo que no se edita: concentra el marcado
 * —una lista de definiciones, no párrafos sueltos— para que toda la plataforma
 * presente los datos de una ficha igual y un lector de pantalla pueda recorrerlos
 * por pares etiqueta/valor.
 *
 * No conoce ningún dominio. La rejilla se decide desde fuera porque cuántas
 * columnas caben depende de dónde se monte, no del componente.
 */
export function DetailFieldList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return <dl className={cn('grid gap-4', className)}>{children}</dl>;
}

interface DetailFieldProps {
  label: string;

  /** Texto del campo. Se ignora si se pasan hijos. */
  value?: string | null;

  /** Contenido propio, para lo que no es texto plano: una fecha, una etiqueta. */
  children?: ReactNode;

  /** Qué mostrar cuando no hay valor. Por omisión, la marca de ausente. */
  emptyLabel?: string;
}

/**
 * Un campo de una ficha: su etiqueta y su valor.
 *
 * La etiqueta se muestra siempre, también en pantallas pequeñas: un valor sin
 * etiqueta obliga a adivinar qué significa "Zona Caribe".
 */
export function DetailField({
  label,
  value,
  children,
  emptyLabel = EMPTY_VALUE,
}: DetailFieldProps): React.JSX.Element {
  const isMissing =
    children === undefined && (value === null || value === undefined || value === '');

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', isMissing && 'text-muted-foreground')}>
        {isMissing ? emptyLabel : (children ?? value)}
      </dd>
    </div>
  );
}
