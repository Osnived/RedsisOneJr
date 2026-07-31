import { Outlet, createRoute, redirect, useRouterState } from '@tanstack/react-router';
import { AppShell } from '@/shared/components/layout/app-shell';
import { Forbidden } from '@/shared/components/layout/forbidden';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { findModuleForPath } from '@/shared/lib/route-module';
import { useAuthStore } from '@/stores/auth.store';
import { rootRoute } from './root.route';

/**
 * Ruta contenedora de todo lo que exige sesión.
 *
 * Colgar las páginas privadas de aquí evita repetir la comprobación en cada
 * ruta: un módulo nuevo queda protegido por el hecho de declararse dentro.
 *
 * Esta comprobación es de experiencia de usuario, no de seguridad: la
 * autorización real la aplica el backend en cada petición, y devuelve 403 aunque
 * alguien evite esta pantalla.
 */
export const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: AuthenticatedLayout,
});

/**
 * Aplica el acceso a módulos a toda ruta privada.
 *
 * La comprobación está aquí y no en cada página por dos razones: ninguna
 * pantalla necesita repetirla, y una pantalla nueva no puede olvidarse de
 * hacerla. El módulo se deduce de la ruta a través del catálogo.
 *
 * El menú se sigue dibujando: quien llega a una URL que no le corresponde debe
 * poder volver a lo que sí, no quedarse encerrado en un 403.
 */
function AuthenticatedLayout(): React.JSX.Element {
  const auth = useAuthorization();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const module = findModuleForPath(pathname);
  const isAllowed = module === null || auth.canAccess(module.key);

  return <AppShell>{isAllowed ? <Outlet /> : <Forbidden moduleLabel={module?.label} />}</AppShell>;
}
