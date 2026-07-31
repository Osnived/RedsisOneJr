import { createRouter } from '@tanstack/react-router';
import { authenticatedRoute } from './authenticated.route';
import { dashboardRoute } from './dashboard.route';
import { loginRoute } from './login.route';
import { rootRoute } from './root.route';
import { securityRoute } from './security.route';
import { ticketsRoute } from './tickets.route';
import { usersRoute } from './users.route';

/**
 * Árbol de rutas declarado a mano.
 *
 * Las rutas privadas cuelgan de `authenticatedRoute`, que exige sesión y aplica
 * el acceso al módulo correspondiente. Añadir un módulo es añadirlo a esa rama y
 * declarar su ruta en el catálogo compartido; la protección viene de serie.
 */
const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([dashboardRoute, ticketsRoute, usersRoute, securityRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
