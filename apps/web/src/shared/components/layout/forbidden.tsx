import { ShieldOff } from 'lucide-react';

/**
 * Pantalla de acceso denegado.
 *
 * Se muestra en lugar del contenido, no solo se oculta el menú: alguien que
 * escribe la URL a mano tiene que encontrarse una puerta cerrada, no una página
 * vacía que parezca un fallo.
 *
 * Dice qué módulo hacía falta y no por qué se denegó: el motivo es información
 * de la configuración de accesos, y quien no entra al módulo tampoco debe
 * conocerla.
 */
export function Forbidden({ moduleLabel }: { moduleLabel?: string }): React.JSX.Element {
  return (
    <section
      aria-labelledby="acceso-denegado"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center"
    >
      <ShieldOff className="size-10 text-muted-foreground" aria-hidden="true" />

      <p className="text-4xl font-semibold">403</p>

      <h1 id="acceso-denegado" className="text-lg font-medium">
        No autorizado.
      </h1>

      <p className="text-sm text-muted-foreground">
        {moduleLabel === undefined
          ? 'No tienes acceso a esta pantalla.'
          : `Tu rol no tiene acceso al módulo ${moduleLabel}.`}{' '}
        Si crees que deberías tenerlo, pídelo a quien administre la seguridad de la plataforma.
      </p>
    </section>
  );
}
