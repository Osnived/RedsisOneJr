import { ShieldOff } from 'lucide-react';

interface ForbiddenProps {
  /** Módulo al que hacía falta acceso. Lo usa la protección de rutas. */
  moduleLabel?: string;

  /**
   * Explicación concreta, cuando falta un permiso y no el módulo entero.
   *
   * Se admite porque las dos negativas se parecen para quien las lee —no puede
   * entrar— y deben verse igual, aunque el motivo técnico sea distinto.
   */
  detail?: string;
}

/**
 * Pantalla de acceso denegado.
 *
 * Es la **única** forma en la que la aplicación dice "no puedes entrar aquí", la
 * pida la protección de rutas o la propia pantalla al faltar un permiso. Tener dos
 * presentaciones para lo mismo hacía que la misma situación pareciera dos
 * problemas distintos.
 *
 * Se muestra en lugar del contenido, no solo se oculta el menú: alguien que
 * escribe la URL a mano tiene que encontrarse una puerta cerrada, no una página
 * vacía que parezca un fallo.
 *
 * Dice qué hacía falta y no por qué se denegó: el motivo es información de la
 * configuración de accesos, y quien no entra tampoco debe conocerla.
 */
export function Forbidden({ moduleLabel, detail }: ForbiddenProps): React.JSX.Element {
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
        {describeDenial(moduleLabel, detail)} Si crees que deberías tenerlo, pídelo a quien
        administre la seguridad de la plataforma.
      </p>
    </section>
  );
}

function describeDenial(moduleLabel?: string, detail?: string): string {
  if (detail !== undefined) {
    return detail;
  }

  return moduleLabel === undefined
    ? 'No tienes acceso a esta pantalla.'
    : `Tu rol no tiene acceso al módulo ${moduleLabel}.`;
}
