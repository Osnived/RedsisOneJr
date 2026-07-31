import { describe, expect, it } from 'vitest';
import type { AuthTokens, AuthenticatedUser } from '@redsis/contracts';
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
    modules: [],
    permissions,
  };
}

/**
 * El store no responde preguntas de autorización: solo guarda la sesión. Quien
 * decide es `createAuthorizationService`, y sus pruebas están en
 * `shared/lib/authorization.spec.ts`.
 */

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
});
