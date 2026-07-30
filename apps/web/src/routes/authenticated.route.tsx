import { Outlet, createRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/app-shell';
import { useAuthStore } from '@/stores/auth.store';
import { rootRoute } from './root.route';

/**
 * Ruta contenedora de todo lo que exige sesión.
 *
 * Colgar las páginas privadas de aquí evita repetir la comprobación en cada
 * ruta: un módulo nuevo queda protegido por el hecho de declararse dentro.
 *
 * Esta comprobación es de experiencia de usuario, no de seguridad: la
 * autorización real la aplica el backend en cada petición.
 */
export const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
