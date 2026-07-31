/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import { PERMISSIONS, type Permission, type UserSummary } from '@redsis/contracts';
import { buildUserActions } from './user-actions';

function buildUser(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'user-1',
    email: 'ana@redsis.com',
    fullName: 'Ana Pérez',
    isActive: true,
    roles: ['supervisor'],
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: null,
    ...overrides,
  };
}

function build(options: { permissions: Permission[]; currentUserId?: string }) {
  const onEdit = vi.fn();
  const onSetActive = vi.fn();

  const actions = buildUserActions({
    can: (permission) => options.permissions.includes(permission),
    currentUserId: options.currentUserId,
    onEdit,
    onSetActive,
  });

  return { actions, onEdit, onSetActive };
}

function visibleIds(actions: ReturnType<typeof buildUserActions>, user: UserSummary): string[] {
  return actions.filter((action) => !action.isHidden?.(user)).map((action) => action.id);
}

describe('buildUserActions', () => {
  it('no ofrece eliminar: los usuarios se suspenden', () => {
    const { actions } = build({ permissions: [PERMISSIONS.USERS_EDIT] });

    expect(actions.map((action) => action.id)).not.toContain('delete');
  });

  describe('sin permiso de edición', () => {
    it('no muestra ninguna acción', () => {
      const { actions } = build({ permissions: [PERMISSIONS.USERS_VIEW] });

      expect(visibleIds(actions, buildUser())).toEqual([]);
    });
  });

  describe('con permiso de edición', () => {
    it('ofrece editar y suspender a un usuario activo', () => {
      const { actions } = build({ permissions: [PERMISSIONS.USERS_EDIT] });

      expect(visibleIds(actions, buildUser({ isActive: true }))).toEqual(['edit', 'suspend']);
    });

    it('ofrece editar y activar a un usuario suspendido', () => {
      const { actions } = build({ permissions: [PERMISSIONS.USERS_EDIT] });

      expect(visibleIds(actions, buildUser({ isActive: false }))).toEqual(['edit', 'activate']);
    });

    it('nunca ofrece activar y suspender a la vez', () => {
      const { actions } = build({ permissions: [PERMISSIONS.USERS_EDIT] });

      for (const isActive of [true, false]) {
        const ids = visibleIds(actions, buildUser({ isActive }));
        expect(ids.includes('activate') && ids.includes('suspend')).toBe(false);
      }
    });
  });

  describe('protección de la propia cuenta', () => {
    it('deshabilita suspenderse a uno mismo', () => {
      const { actions } = build({
        permissions: [PERMISSIONS.USERS_EDIT],
        currentUserId: 'user-1',
      });
      const suspend = actions.find((action) => action.id === 'suspend');

      expect(suspend?.isDisabled?.(buildUser({ id: 'user-1' }))).toBe(true);
    });

    it('permite suspender a otra persona', () => {
      const { actions } = build({
        permissions: [PERMISSIONS.USERS_EDIT],
        currentUserId: 'user-1',
      });
      const suspend = actions.find((action) => action.id === 'suspend');

      expect(suspend?.isDisabled?.(buildUser({ id: 'user-2' }))).toBe(false);
    });
  });

  describe('invocación', () => {
    it('editar entrega el usuario completo', () => {
      const { actions, onEdit } = build({ permissions: [PERMISSIONS.USERS_EDIT] });
      const user = buildUser();

      actions.find((action) => action.id === 'edit')?.onSelect(user);

      expect(onEdit).toHaveBeenCalledWith(user);
    });

    it('suspender pide el estado inactivo', () => {
      const { actions, onSetActive } = build({ permissions: [PERMISSIONS.USERS_EDIT] });
      const user = buildUser();

      actions.find((action) => action.id === 'suspend')?.onSelect(user);

      expect(onSetActive).toHaveBeenCalledWith(user, false);
    });

    it('activar pide el estado activo', () => {
      const { actions, onSetActive } = build({ permissions: [PERMISSIONS.USERS_EDIT] });
      const user = buildUser({ isActive: false });

      actions.find((action) => action.id === 'activate')?.onSelect(user);

      expect(onSetActive).toHaveBeenCalledWith(user, true);
    });
  });

  it('marca suspender como destructiva y aislada por un separador', () => {
    const { actions } = build({ permissions: [PERMISSIONS.USERS_EDIT] });
    const suspend = actions.find((action) => action.id === 'suspend');

    expect(suspend?.destructive).toBe(true);
    expect(suspend?.separatorBefore).toBe(true);
  });
});
