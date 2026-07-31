import { APP_MODULE_DEFINITIONS, type AppModuleDefinition } from '@redsis/contracts';

/**
 * Módulo al que pertenece una ruta.
 *
 * Se resuelve desde el catálogo, así que una pantalla nueva queda protegida por
 * el hecho de declarar su módulo con una ruta: nadie tiene que acordarse de
 * añadir la comprobación.
 *
 * La coincidencia es por prefijo para que las rutas hijas hereden el módulo del
 * padre: `/tickets/INC-2026-000101` pertenece a Tickets. La raíz se compara
 * exacta, porque de lo contrario sería el prefijo de todo.
 *
 * Devuelve null si ninguna ruta del catálogo cubre el camino. En ese caso no hay
 * módulo que exigir y la pantalla decide por sí misma.
 */
export function findModuleForPath(pathname: string): AppModuleDefinition | null {
  const candidates = APP_MODULE_DEFINITIONS.filter((definition) => definition.route !== null);

  const match = candidates.find((definition) =>
    definition.route === '/' ? pathname === '/' : isWithin(pathname, definition.route ?? ''),
  );

  return match ?? null;
}

function isWithin(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}
