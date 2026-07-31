import { APP_MODULES } from '@redsis/contracts';
import { resolveViewMode, type ViewMode, type ViewModeDecision } from '@/shared/lib/view-mode';
import { useAuthorization } from './use-authorization';
import { useIsMobile } from './use-is-mobile';

interface UseViewModeOptions {
  /**
   * Elección explícita del usuario para este módulo.
   *
   * Todavía no hay dónde guardarla; se acepta desde ahora para que cuando exista
   * el módulo de Configuración solo haya que pasarla.
   */
  preference?: ViewMode | null;
}

/**
 * Módulos cuyo acceso identifica a quien administra la plataforma.
 *
 * Se declara aquí, junto a la decisión, y no en el catálogo compartido: es una
 * regla de presentación de este hook, no una propiedad de los módulos.
 */
const ADMINISTRATIVE_MODULES = [APP_MODULES.USERS, APP_MODULES.SECURITY] as const;

/**
 * Cómo debe representarse un módulo: tabla o tarjetas.
 *
 * Encapsula la decisión completa. Una página pregunta qué modo usar y recibe
 * también el motivo; nunca consulta el tamaño de la pantalla ni los accesos por su
 * cuenta. Eso es lo que permite cambiar la regla en un solo sitio.
 *
 * Quién administra se resuelve con el servicio de autorización, nunca comparando
 * nombres de rol (ver AGENTS.md y CODING_STANDARDS.md).
 */
export function useViewMode({ preference = null }: UseViewModeOptions = {}): ViewModeDecision {
  const auth = useAuthorization();
  const isMobile = useIsMobile();

  const administersPlatform = ADMINISTRATIVE_MODULES.some((module) => auth.canAccess(module));

  return resolveViewMode({ administersPlatform, isMobile, preference });
}
