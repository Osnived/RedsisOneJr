import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { DataTable } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import {
  getPermissionRowId,
  permissionColumns,
} from '@/features/permissions/columns/permission.columns';
import { usePermissionCatalog } from '@/features/permissions/use-permissions';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

export const permissionsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/permissions',
  component: PermissionsPage,
});

/**
 * Catálogo de permisos.
 *
 * Es de solo lectura: los permisos los define el código y la semilla los
 * inserta. Sirve para saber qué accesos existen y con qué código se conceden.
 */
function PermissionsPage(): React.JSX.Element {
  const can = useAuthStore((state) => state.can);
  const catalogQuery = usePermissionCatalog();

  if (!can(PERMISSIONS.PERMISSIONS_VIEW)) {
    return <Alert variant="destructive">No tienes permiso para consultar el catálogo.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Permisos</h1>
        <p className="text-sm text-muted-foreground">
          {catalogQuery.isPending
            ? 'Consultando...'
            : `${catalogQuery.data?.length ?? 0} permisos disponibles`}
        </p>
      </header>

      <Alert>
        Catálogo de solo lectura. Los permisos son la unidad mínima de autorización y se conceden
        agrupándolos en roles.
      </Alert>

      <DataTable
        tableId={TABLE_IDS.PERMISSIONS}
        columns={permissionColumns}
        data={catalogQuery.data ?? []}
        getRowId={getPermissionRowId}
        loading={catalogQuery.isPending}
        error={catalogQuery.error}
        searchPlaceholder="Buscar por permiso, módulo o acción..."
        emptyMessage="El catálogo de permisos está vacío"
      />
    </div>
  );
}
