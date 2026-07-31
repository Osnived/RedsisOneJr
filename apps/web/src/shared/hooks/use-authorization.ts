import { useMemo } from 'react';
import { createAuthorizationService, type AuthorizationService } from '@/shared/lib/authorization';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Servicio de autorización de la sesión actual.
 *
 * Es la única forma de preguntar si algo está permitido:
 *
 * ```tsx
 * const auth = useAuthorization();
 *
 * if (!auth.canAccess(APP_MODULES.TICKETS)) return <Forbidden />;
 * if (auth.can(PERMISSIONS.TICKETS_EDIT)) { ... }
 * ```
 *
 * Está prohibido leer `user.permissions` o comparar nombres de rol desde una
 * pantalla (ver AGENTS.md). El resto de la aplicación no debe saber cómo se
 * calculan los accesos, solo preguntar.
 */
export function useAuthorization(): AuthorizationService {
  const modules = useAuthStore((state) => state.user?.modules);
  const permissions = useAuthStore((state) => state.user?.permissions);

  return useMemo(
    () => createAuthorizationService({ modules: modules ?? [], permissions: permissions ?? [] }),
    [modules, permissions],
  );
}
