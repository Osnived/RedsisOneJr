import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS } from '@redsis/contracts';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { usersApi } from '@/features/auth/auth.api';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

const PAGE_SIZE = 10;

export const usersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/users',
  component: UsersPage,
});

function UsersPage(): React.JSX.Element {
  const can = useAuthStore((state) => state.can);
  const [page, setPage] = useState(1);

  const usersQuery = useQuery({
    queryKey: ['users', { page, pageSize: PAGE_SIZE }],
    queryFn: () => usersApi.list(page, PAGE_SIZE),
    enabled: can(PERMISSIONS.USERS_VIEW),
  });

  if (!can(PERMISSIONS.USERS_VIEW)) {
    return <Alert variant="destructive">No tienes permiso para consultar usuarios.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {usersQuery.data ? `${usersQuery.data.total} registrados` : 'Consultando...'}
        </p>
      </header>

      {usersQuery.isError ? (
        <Alert variant="destructive">
          {usersQuery.error instanceof ApiError
            ? usersQuery.error.message
            : 'No se pudieron obtener los usuarios'}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.isPending ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nombre</th>
                    <th className="pb-2 font-medium">Correo</th>
                    <th className="pb-2 font-medium">Roles</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data?.items.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3">{user.fullName}</td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3 capitalize">{user.roles.join(', ') || '—'}</td>
                      <td className="py-3">
                        <span className={user.isActive ? 'text-success' : 'text-muted-foreground'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {usersQuery.data && usersQuery.data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {usersQuery.data.page} de {usersQuery.data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= usersQuery.data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </div>
  );
}
