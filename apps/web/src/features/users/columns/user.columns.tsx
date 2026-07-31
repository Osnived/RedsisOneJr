import type { UserSummary } from '@redsis/contracts';
import { Badge } from '@/shared/components/ui/badge';
import { defineColumns } from '@/shared/lib/table/registry';

/**
 * Columnas del módulo de Usuarios.
 *
 * Segundo módulo que usa el registro, y sirve de comprobación del criterio de
 * aceptación: incorporar un dominio distinto no requirió modificar el DataTable
 * ni ninguno de sus componentes internos, solo añadir este archivo.
 */
export const userColumns = defineColumns<UserSummary>([
  {
    id: 'fullName',
    header: 'Nombre',
    accessor: (user) => user.fullName,
    // Sin el nombre la fila no identifica a nadie.
    hideable: false,
    width: 200,
  },
  {
    id: 'email',
    header: 'Correo',
    accessor: (user) => user.email,
    width: 220,
  },
  {
    id: 'roles',
    header: 'Roles',
    accessor: (user) => user.roles,
    width: 180,
    // Los roles no ordenan de forma útil: un usuario puede tener varios.
    sortable: false,
    cell: (user) => <span className="capitalize">{user.roles.join(', ') || '—'}</span>,
  },
  {
    id: 'isActive',
    header: 'Estado',
    accessor: (user) => user.isActive,
    width: 110,
    align: 'center',
    cell: (user) => (
      <Badge variant={user.isActive ? 'success' : 'neutral'}>
        {user.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    id: 'lastLoginAt',
    header: 'Último acceso',
    // Nulo si el usuario nunca ha entrado; el framework lo muestra como vacío.
    accessor: (user) => (user.lastLoginAt ? new Date(user.lastLoginAt) : null),
    width: 150,
  },
  {
    id: 'createdAt',
    header: 'Creación',
    accessor: (user) => new Date(user.createdAt),
    width: 130,
    hiddenByDefault: true,
  },
]);

/** Identidad estable de una fila de Usuarios. */
export const getUserRowId = (user: UserSummary): string => user.id;
