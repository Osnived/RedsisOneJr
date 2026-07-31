import { createRouter } from '@tanstack/react-router';
import { authenticatedRoute } from './authenticated.route';
import { dashboardRoute } from './dashboard.route';
import { loginRoute } from './login.route';
import { permissionsRoute } from './permissions.route';
import { rolesRoute } from './roles.route';
import { rootRoute } from './root.route';
import { ticketsRoute } from './tickets.route';
import { usersRoute } from './users.route';

/**
 * Árbol de rutas declarado a mano.
 *
 * Las rutas privadas cuelgan de `authenticatedRoute`, que exige sesión; añadir
 * un módulo nuevo es añadirlo a esa rama.
 */
const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    ticketsRoute,
    usersRoute,
    rolesRoute,
    permissionsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
