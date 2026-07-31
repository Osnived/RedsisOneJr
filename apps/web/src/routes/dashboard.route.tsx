import { createRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS } from '@redsis/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/ui/spinner';
import { usersApi } from '@/features/users/users.api';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: DashboardPage,
});

function DashboardPage(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const can = useAuthStore((state) => state.can);

  // Solo se consulta lo que el usuario tiene permiso de ver: así se evita
  // provocar un 403 desde la propia interfaz.
  const usersQuery = useQuery({
    queryKey: ['users', { page: 1, pageSize: 1 }],
    queryFn: () => usersApi.list(1, 1),
    enabled: can(PERMISSIONS.USERS_VIEW),
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-sm text-muted-foreground">Bienvenido, {user?.fullName ?? 'usuario'}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Rol asignado</CardDescription>
            <CardTitle className="capitalize">{user?.roles.join(', ') ?? '—'}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Permisos efectivos</CardDescription>
            <CardTitle>{user?.permissions.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>

        {can(PERMISSIONS.USERS_VIEW) ? (
          <Card>
            <CardHeader>
              <CardDescription>Usuarios registrados</CardDescription>
              <CardTitle>
                {usersQuery.isPending ? <Spinner /> : (usersQuery.data?.total ?? '—')}
              </CardTitle>
            </CardHeader>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquitectura verificada</CardTitle>
          <CardDescription>
            Esta pantalla obtuvo sus datos recorriendo la cadena completa: React consultó la API de
            NestJS, que resolvió la petición con un Repository y su Provider de PostgreSQL. El
            frontend no conoce el origen de los datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            <li>Autenticación propia con JWT y refresh rotativo</li>
            <li>Autorización basada en permisos, no en roles</li>
            <li>Historial de actividad para cada acción relevante</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
