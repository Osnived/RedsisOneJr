import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UserSummary } from '@redsis/contracts';
import { getUserRowId, userColumns } from './user.columns';

function buildUser(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'user-1',
    email: 'admin@redsis.com',
    fullName: 'Administrador',
    isActive: true,
    roles: ['administrador'],
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: '2026-07-30T12:00:00.000Z',
    ...overrides,
  };
}

function renderCell(columnId: string, user: UserSummary) {
  const column = userColumns.find((candidate) => candidate.id === columnId);

  if (!column?.cell) {
    throw new Error(`La columna ${columnId} no define render propio`);
  }

  return render(<>{column.cell(user)}</>);
}

describe('userColumns', () => {
  it('declara las columnas del módulo', () => {
    expect(userColumns.map((column) => column.id)).toEqual([
      'fullName',
      'email',
      'roles',
      'isActive',
      'lastLoginAt',
      'createdAt',
    ]);
  });

  it('no permite ocultar el nombre', () => {
    expect(userColumns.find((column) => column.id === 'fullName')?.hideable).toBe(false);
  });

  it('no ofrece ordenar por roles: un usuario puede tener varios', () => {
    expect(userColumns.find((column) => column.id === 'roles')?.sortable).toBe(false);
  });

  it('convierte el último acceso a fecha para ordenar cronológicamente', () => {
    const column = userColumns.find((candidate) => candidate.id === 'lastLoginAt');

    expect(column?.accessor(buildUser())).toBeInstanceOf(Date);
  });

  it('deja nulo el último acceso de quien nunca ha entrado', () => {
    const column = userColumns.find((candidate) => candidate.id === 'lastLoginAt');

    expect(column?.accessor(buildUser({ lastLoginAt: null }))).toBeNull();
  });

  describe('render de estado', () => {
    it('marca al usuario activo', () => {
      renderCell('isActive', buildUser({ isActive: true }));

      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('marca al usuario inactivo', () => {
      renderCell('isActive', buildUser({ isActive: false }));

      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });

  describe('render de roles', () => {
    it('une varios roles con coma', () => {
      renderCell('roles', buildUser({ roles: ['supervisor', 'tecnico'] }));

      expect(screen.getByText('supervisor, tecnico')).toBeInTheDocument();
    });

    it('muestra un guion cuando no tiene roles', () => {
      renderCell('roles', buildUser({ roles: [] }));

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});

describe('getUserRowId', () => {
  it('usa el identificador del usuario', () => {
    expect(getUserRowId(buildUser({ id: 'user-7' }))).toBe('user-7');
  });
});
