import { groupPermissionsByModule, type RoleSummary } from '@redsis/contracts';
import { Badge } from '@/shared/components/ui/badge';
import { defineColumns } from '@/shared/lib/table/registry';

/**
 * Columnas del módulo de Roles.
 *
 * Un rol solo agrupa permisos, así que la información útil es cuántos otorga, de
 * cuántos módulos y a cuánta gente afecta. El detalle de cada permiso se
 * consulta en la pantalla de Permisos.
 */
export const roleColumns = defineColumns<RoleSummary>([
  {
    id: 'name',
    header: 'Rol',
    accessor: (role) => role.name,
    // Sin el nombre la fila no identifica nada.
    hideable: false,
    width: 170,
    cell: (role) => <span className="font-medium capitalize">{role.name}</span>,
  },
  {
    id: 'description',
    header: 'Descripción',
    accessor: (role) => role.description,
    width: 260,
  },
  {
    id: 'permissionCount',
    header: 'Permisos',
    // Se ordena por la cantidad, no por el arreglo: un arreglo no ordena de
    // forma útil y el número sí responde a "quién tiene más acceso".
    accessor: (role) => role.permissions.length,
    width: 110,
    align: 'center',
  },
  {
    id: 'moduleCount',
    header: 'Módulos',
    accessor: (role) => Object.keys(groupPermissionsByModule(role.permissions)).length,
    width: 110,
    align: 'center',
  },
  {
    id: 'userCount',
    header: 'Usuarios',
    accessor: (role) => role.userCount,
    width: 110,
    align: 'center',
  },
  {
    id: 'isSystem',
    header: 'Origen',
    accessor: (role) => role.isSystem,
    width: 130,
    align: 'center',
    cell: (role) => (
      <Badge variant={role.isSystem ? 'info' : 'neutral'}>
        {role.isSystem ? 'Del sistema' : 'Personalizado'}
      </Badge>
    ),
  },
]);

export const getRoleRowId = (role: RoleSummary): string => role.id;
