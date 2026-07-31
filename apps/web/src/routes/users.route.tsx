import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@redsis/contracts';
import { Alert } from '@/components/ui/alert';
import { DataTable } from '@/components/table';
import { TABLE_IDS } from '@/lib/table/registry';
import { getUserRowId, userColumns } from '@/features/users/columns/user.columns';
import { useUsers } from '@/features/users/use-users';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

const PAGE_SIZE = 25;

export const usersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/users',
  component: UsersPage,
});

/**
 * Pantalla de Usuarios.
 *
 * Usa el framework de tablas igual que Tickets. Antes tenía su propia tabla
 * escrita a mano, con su paginación aparte y sin búsqueda ni columnas
 * configurables: era la misma solución resuelta dos veces.
 *
 * Los datos vienen del backend, que resuelve con Repository y Provider sobre
 * PostgreSQL. La pantalla no sabe de dónde salen.
 */
function UsersPage(): React.JSX.Element {
  const can = useAuthStore((state) => state.can);
  const usersQuery = useUsers(1, PAGE_SIZE);

  if (!can(PERMISSIONS.USERS_VIEW)) {
    return <Alert variant="destructive">No tienes permiso para consultar usuarios.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {usersQuery.isPending ? 'Consultando...' : `${usersQuery.data?.total ?? 0} registrados`}
        </p>
      </header>

      <DataTable
        tableId={TABLE_IDS.USERS}
        columns={userColumns}
        data={usersQuery.data?.items ?? []}
        getRowId={getUserRowId}
        loading={usersQuery.isPending}
        error={usersQuery.error}
        searchPlaceholder="Buscar por nombre o correo..."
        emptyMessage="No hay usuarios registrados"
      />
    </div>
  );
}
