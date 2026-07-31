import { useSyncExternalStore } from 'react';

/**
 * Límite entre móvil y escritorio.
 *
 * Coincide con el `md` de Tailwind para que la decisión de qué se muestra y la
 * de cómo se maqueta no puedan discrepar.
 */
const MOBILE_QUERY = '(max-width: 767px)';

/**
 * Si el dispositivo es de pantalla pequeña.
 *
 * Es el único sitio de la aplicación que mira el tamaño de la pantalla. Ninguna
 * página debe consultarlo: para decidir qué mostrar existe `useViewMode`, que
 * considera además el rol y las preferencias.
 *
 * Se usa `useSyncExternalStore` en lugar de un efecto con estado porque el
 * tamaño de la ventana es exactamente eso: una fuente externa a React. Así no
 * hay un render intermedio con el valor equivocado.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(onChange: () => void): () => void {
  const query = matchMobile();

  if (!query) {
    return () => undefined;
  }

  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return matchMobile()?.matches ?? false;
}

/** Sin ventana no hay pantalla pequeña: se asume escritorio. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * `matchMedia` no existe en todos los entornos donde se ejecutan las pruebas.
 * Sin él la aplicación se comporta como en escritorio en lugar de fallar.
 */
function matchMobile(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia(MOBILE_QUERY);
}
