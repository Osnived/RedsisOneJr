import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PERMISSIONS, type RoleSummary } from '@redsis/contracts';
import { getRoleRowId, roleColumns } from './role.columns';

function buildRole(overrides: Partial<RoleSummary> = {}): RoleSummary {
  return {
    id: 'role-1',
    name: 'administrador',
    description: 'Acceso total a la plataforma',
    isSystem: true,
    permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT, PERMISSIONS.DASHBOARD_VIEW],
    userCount: 2,
    ...overrides,
  };
}

function renderCell(columnId: string, role: RoleSummary) {
  const column = roleColumns.find((candidate) => candidate.id === columnId);

  if (!column?.cell) {
    throw new Error(`La columna ${columnId} no define render propio`);
  }

  return render(<>{column.cell(role)}</>);
}

describe('roleColumns', () => {
  it('declara las columnas del módulo', () => {
    expect(roleColumns.map((column) => column.id)).toEqual([
      'name',
      'description',
      'permissionCount',
      'moduleCount',
      'userCount',
      'isSystem',
    ]);
  });

  it('no permite ocultar el nombre del rol', () => {
    expect(roleColumns.find((column) => column.id === 'name')?.hideable).toBe(false);
  });

  it('ordena por cantidad de permisos, no por el arreglo', () => {
    const column = roleColumns.find((candidate) => candidate.id === 'permissionCount');

    expect(column?.accessor(buildRole())).toBe(3);
  });

  it('cuenta los módulos distintos que abarca el rol', () => {
    const column = roleColumns.find((candidate) => candidate.id === 'moduleCount');

    // users.view + users.edit + dashboard.view -> 2 módulos
    expect(column?.accessor(buildRole())).toBe(2);
  });

  it('cuenta cero módulos en un rol sin permisos', () => {
    const column = roleColumns.find((candidate) => candidate.id === 'moduleCount');

    expect(column?.accessor(buildRole({ permissions: [] }))).toBe(0);
  });

  it('distingue un rol del sistema de uno personalizado', () => {
    renderCell('isSystem', buildRole({ isSystem: true }));
    expect(screen.getByText('Del sistema')).toBeInTheDocument();
  });

  it('marca como personalizado un rol creado a mano', () => {
    renderCell('isSystem', buildRole({ isSystem: false }));
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });
});

describe('getRoleRowId', () => {
  it('usa el identificador del rol', () => {
    expect(getRoleRowId(buildRole({ id: 'role-9' }))).toBe('role-9');
  });
});
