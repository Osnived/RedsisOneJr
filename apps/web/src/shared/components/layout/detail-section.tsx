import { useId, type ReactNode } from 'react';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

interface DetailSectionProps {
  /** Título visible. Además nombra la región para quien navega por secciones. */
  title: string;

  description?: string;

  /** Controles propios de la sección, alineados con el título. */
  actions?: ReactNode;

  children: ReactNode;

  className?: string;
}

/**
 * Una sección con nombre dentro de una ficha.
 *
 * Es la pieza con la que se divide una pantalla de detalle en partes claras:
 * información, historia, cambios, acciones. Sin ella cada pantalla resolvería el
 * mismo problema —el título, el separador, el relleno, el nombre accesible— de una
 * forma distinta.
 *
 * Es una `section` y no un `div` para que su título la nombre: así se puede llegar
 * a "Timeline" saltando por regiones en lugar de recorriendo la pantalla entera.
 * El título es `h2` porque en una ficha el `h1` es lo que identifica la entidad.
 *
 * No conoce ningún dominio ni decide su ancho: dónde se coloca lo resuelve la
 * pantalla que la monta.
 */
export function DetailSection({
  title,
  description,
  actions,
  children,
  className,
}: DetailSectionProps): React.JSX.Element {
  const headingId = useId();

  return (
    <Card asChild className={cn('flex flex-col', className)}>
      <section aria-labelledby={headingId}>
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-0.5">
            <h2 id={headingId} className="font-medium">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>

          {actions}
        </div>

        <div className="px-4 py-4 sm:px-5">{children}</div>
      </section>
    </Card>
  );
}
