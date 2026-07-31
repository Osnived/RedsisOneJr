import { resolveViewMode, type ViewMode, type ViewModeDecision } from '@/shared/lib/view-mode';
import { useAuthStore } from '@/stores/auth.store';
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
 * Cómo debe representarse un módulo: tabla o tarjetas.
 *
 * Encapsula la decisión completa. Una página pregunta qué modo usar y recibe
 * también el motivo; nunca consulta el rol ni el tamaño de la pantalla por su
 * cuenta. Eso es lo que permite cambiar la regla en un solo sitio cuando entren
 * más criterios.
 */
export function useViewMode({ preference = null }: UseViewModeOptions = {}): ViewModeDecision {
  const roles = useAuthStore((state) => state.user?.roles);
  const isMobile = useIsMobile();

  return resolveViewMode({ roles: roles ?? [], isMobile, preference });
}
