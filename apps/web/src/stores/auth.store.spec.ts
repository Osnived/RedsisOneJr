import { describe, expect, it } from 'vitest';
import { PERMISSIONS, type AuthTokens, type AuthenticatedUser } from '@redsis/contracts';
import { useAuthStore } from './auth.store';

const TOKENS: AuthTokens = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresIn: 900,
};

function buildUser(permissions: string[] = []): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'admin@redsis.com',
    fullName: 'Administrador',
    isActive: true,
    roles: ['administrador'],
    permissions,
  };
}

describe('useAuthStore', () => {
  it('empieza sin sesión', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  it('guarda la sesión al iniciar', () => {
    useAuthStore.getState().setSession(buildUser(), TOKENS);

    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('admin@redsis.com');
  });

  it('renueva solo los tokens sin perder el usuario', () => {
    useAuthStore.getState().setSession(buildUser(), TOKENS);

    useAuthStore.getState().setTokens({ ...TOKENS, accessToken: 'nuevo-access' });

    expect(useAuthStore.getState().tokens?.accessToken).toBe('nuevo-access');
    expect(useAuthStore.getState().user?.email).toBe('admin@redsis.com');
  });

  it('limpia la sesión al cerrar', () => {
    useAuthStore.getState().setSession(buildUser(), TOKENS);

    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    expect(useAuthStore.getState().tokens).toBeNull();
  });

  describe('can', () => {
    it('concede acceso cuando el usuario tiene el permiso', () => {
      useAuthStore.getState().setSession(buildUser([PERMISSIONS.USERS_VIEW]), TOKENS);

      expect(useAuthStore.getState().can(PERMISSIONS.USERS_VIEW)).toBe(true);
    });

    it('niega el acceso cuando falta el permiso', () => {
      useAuthStore.getState().setSession(buildUser([PERMISSIONS.USERS_VIEW]), TOKENS);

      expect(useAuthStore.getState().can(PERMISSIONS.USERS_DELETE)).toBe(false);
    });

    it('niega el acceso cuando no hay sesión', () => {
      expect(useAuthStore.getState().can(PERMISSIONS.USERS_VIEW)).toBe(false);
    });
  });

  describe('canAny', () => {
    it('basta con uno de los permisos', () => {
      useAuthStore.getState().setSession(buildUser([PERMISSIONS.DASHBOARD_VIEW]), TOKENS);

      expect(
        useAuthStore.getState().canAny([PERMISSIONS.USERS_VIEW, PERMISSIONS.DASHBOARD_VIEW]),
      ).toBe(true);
    });

    it('falla si no tiene ninguno', () => {
      useAuthStore.getState().setSession(buildUser([PERMISSIONS.MAPS_VIEW]), TOKENS);

      expect(useAuthStore.getState().canAny([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT])).toBe(
        false,
      );
    });

    it('con lista vacía no concede acceso', () => {
      useAuthStore.getState().setSession(buildUser([PERMISSIONS.MAPS_VIEW]), TOKENS);

      expect(useAuthStore.getState().canAny([])).toBe(false);
    });
  });
});
