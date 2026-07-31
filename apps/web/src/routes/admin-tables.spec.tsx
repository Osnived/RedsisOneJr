import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PERMISSIONS,
  type AuthTokens,
  type Permission,
  type PermissionSummary,
  type RoleSummary,
} from '@redsis/contracts';
import { DataTable } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getRoleRowId, roleColumns } from '@/features/roles/columns/role.columns';
import {
  getPermissionRowId,
  permissionColumns,
} from '@/features/permissions/columns/permission.columns';
import { userColumns } from '@/features/users/columns/user.columns';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Comprobación del resultado esperado de BaseTable v1: todas las tablas
 * administrativas se muestran con el mismo componente, sin modificarlo.
 */

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

function authenticate(permissions: Permission[]): void {
  useAuthStore.getState().setSession(
    {
      id: 'user-1',
      email: 'admin@redsis.com',
      fullName: 'Administrador',
      isActive: true,
      roles: ['administrador'],
      permissions,
    },
    TOKENS,
  );
}

const ROLE: RoleSummary = {
  id: 'role-1',
  name: 'supervisor',
  description: 'Supervisa la operación',
  isSystem: true,
  permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.DASHBOARD_VIEW],
  userCount: 3,
};

const PERMISSION: PermissionSummary = {
  id: 'perm-1',
  code: PERMISSIONS.TICKETS_CREATE,
  module: 'tickets',
  description: null,
};

describe('Tablas administrativas con BaseTable', () => {
  it('Roles se muestra con el mismo DataTable', () => {
    render(
      <DataTable<RoleSummary>
        tableId={TABLE_IDS.ROLES}
        columns={roleColumns}
        data={[ROLE]}
        getRowId={getRoleRowId}
      />,
    );

    expect(screen.getByText('supervisor')).toBeInTheDocument();
    expect(screen.getByText('Supervisa la operación')).toBeInTheDocument();
    expect(screen.getByText('Del sistema')).toBeInTheDocument();
  });

  it('Permisos se muestra con el mismo DataTable', () => {
    render(
      <DataTable<PermissionSummary>
        tableId={TABLE_IDS.PERMISSIONS}
        columns={permissionColumns}
        data={[PERMISSION]}
        getRowId={getPermissionRowId}
      />,
    );

    expect(screen.getByText('tickets.create')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
  });

  it('cada tabla administrativa usa un identificador distinto', () => {
    const ids = [TABLE_IDS.USERS, TABLE_IDS.ROLES, TABLE_IDS.PERMISSIONS, TABLE_IDS.TICKETS];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('los tres módulos administrativos declaran columnas propias', () => {
    // Ninguno necesitó modificar el DataTable para existir.
    expect(userColumns.length).toBeGreaterThan(0);
    expect(roleColumns.length).toBeGreaterThan(0);
    expect(permissionColumns.length).toBeGreaterThan(0);

    for (const columns of [userColumns, roleColumns, permissionColumns]) {
      expect(columns.some((column) => column.hideable === false)).toBe(true);
    }
  });
});

describe('Restricción de acceso de las pantallas administrativas', () => {
  it('el administrador ve Roles y Permisos', () => {
    authenticate([PERMISSIONS.ROLES_VIEW, PERMISSIONS.PERMISSIONS_VIEW]);

    expect(useAuthStore.getState().can(PERMISSIONS.ROLES_VIEW)).toBe(true);
    expect(useAuthStore.getState().can(PERMISSIONS.PERMISSIONS_VIEW)).toBe(true);
  });

  it('un supervisor sin esos permisos no las ve', () => {
    // Refleja la semilla: el supervisor conserva usuarios pero no accesos.
    authenticate([PERMISSIONS.USERS_VIEW, PERMISSIONS.DASHBOARD_VIEW]);

    expect(useAuthStore.getState().can(PERMISSIONS.ROLES_VIEW)).toBe(false);
    expect(useAuthStore.getState().can(PERMISSIONS.PERMISSIONS_VIEW)).toBe(false);
  });

  it('un técnico tampoco las ve', () => {
    authenticate([PERMISSIONS.TICKETS_VIEW, PERMISSIONS.DASHBOARD_VIEW]);

    expect(useAuthStore.getState().can(PERMISSIONS.ROLES_VIEW)).toBe(false);
    expect(useAuthStore.getState().can(PERMISSIONS.PERMISSIONS_VIEW)).toBe(false);
  });
});
