import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { DataTable } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getRoleRowId, roleColumns } from '@/features/roles/columns/role.columns';
import { useRoles } from '@/features/roles/use-roles';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

export const rolesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/roles',
  component: RolesPage,
});

/**
 * Pantalla de Roles.
 *
 * Solo la ve quien posee `roles.view`, que en la configuración inicial es
 * únicamente el administrador. La restricción se expresa como permiso y no como
 * comprobación de rol: la autorización nunca depende del cargo (ver AGENTS.md).
 */
function RolesPage(): React.JSX.Element {
  const can = useAuthStore((state) => state.can);
  const rolesQuery = useRoles();

  if (!can(PERMISSIONS.ROLES_VIEW)) {
    return <Alert variant="destructive">No tienes permiso para consultar roles.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Roles</h1>
        <p className="text-sm text-muted-foreground">
          {rolesQuery.isPending
            ? 'Consultando...'
            : `${rolesQuery.data?.length ?? 0} roles definidos`}
        </p>
      </header>

      <Alert>
        Un rol solo agrupa permisos. Quitar un permiso de un rol se lo quita de inmediato a todos
        sus usuarios en la siguiente renovación de sesión.
      </Alert>

      <DataTable
        tableId={TABLE_IDS.ROLES}
        columns={roleColumns}
        data={rolesQuery.data ?? []}
        getRowId={getRoleRowId}
        loading={rolesQuery.isPending}
        error={rolesQuery.error}
        searchPlaceholder="Buscar por rol o descripción..."
        emptyMessage="No hay roles definidos"
      />
    </div>
  );
}
