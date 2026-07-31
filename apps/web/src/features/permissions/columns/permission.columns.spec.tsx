import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PERMISSIONS, type PermissionSummary } from '@redsis/contracts';
import { getPermissionRowId, permissionColumns } from './permission.columns';

function buildPermission(overrides: Partial<PermissionSummary> = {}): PermissionSummary {
  return {
    id: 'perm-1',
    code: PERMISSIONS.USERS_CREATE,
    module: 'users',
    description: null,
    ...overrides,
  };
}

function renderCell(columnId: string, permission: PermissionSummary) {
  const column = permissionColumns.find((candidate) => candidate.id === columnId);

  if (!column?.cell) {
    throw new Error(`La columna ${columnId} no define render propio`);
  }

  return render(<>{column.cell(permission)}</>);
}

describe('permissionColumns', () => {
  it('declara las columnas del catálogo', () => {
    expect(permissionColumns.map((column) => column.id)).toEqual([
      'code',
      'module',
      'action',
      'description',
    ]);
  });

  it('no permite ocultar el código', () => {
    expect(permissionColumns.find((column) => column.id === 'code')?.hideable).toBe(false);
  });

  it('deriva la acción del código del permiso', () => {
    const column = permissionColumns.find((candidate) => candidate.id === 'action');

    expect(column?.accessor(buildPermission({ code: PERMISSIONS.USERS_CREATE }))).toBe('create');
  });

  it('deriva la acción también con módulos compuestos', () => {
    const column = permissionColumns.find((candidate) => candidate.id === 'action');

    expect(column?.accessor(buildPermission({ code: PERMISSIONS.ACTIVITY_LOGS_VIEW }))).toBe(
      'view',
    );
  });

  it('muestra el código tal cual', () => {
    renderCell('code', buildPermission());

    expect(screen.getByText('users.create')).toBeInTheDocument();
  });

  it('muestra el módulo como etiqueta', () => {
    renderCell('module', buildPermission({ module: 'tickets' }));

    expect(screen.getByText('tickets')).toBeInTheDocument();
  });
});

describe('getPermissionRowId', () => {
  it('usa el identificador del permiso', () => {
    expect(getPermissionRowId(buildPermission({ id: 'perm-7' }))).toBe('perm-7');
  });
});
