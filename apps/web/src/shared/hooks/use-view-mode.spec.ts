import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  ALL_APP_MODULES,
  SYSTEM_ROLES,
  type AuthTokens,
  type AuthenticatedUser,
} from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { useViewMode } from './use-view-mode';

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

function authenticateWithRole(role: string): void {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'persona@redsis.com',
    fullName: 'Persona',
    isActive: true,
    roles: [role],
    modules: ALL_APP_MODULES.slice(),
    permissions: [],
  };

  useAuthStore.getState().setSession(user, TOKENS);
}

/**
 * `matchMedia` no existe en jsdom, así que se declara para la prueba. Es la
 * única forma de comprobar la decisión en móvil sin un navegador real.
 */
function simulateViewport({ isMobile }: { isMobile: boolean }): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: isMobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useViewMode', () => {
  it('devuelve tarjetas para un técnico en móvil', () => {
    simulateViewport({ isMobile: true });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    const { result } = renderHook(() => useViewMode());

    expect(result.current).toEqual({ mode: 'cards', reason: 'tecnico-en-movil' });
  });

  it('devuelve la tabla para un técnico en escritorio', () => {
    simulateViewport({ isMobile: false });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });

  it('devuelve la tabla para un supervisor en móvil', () => {
    simulateViewport({ isMobile: true });
    authenticateWithRole(SYSTEM_ROLES.SUPERVISOR);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });

  it('devuelve la tabla sin sesión', () => {
    simulateViewport({ isMobile: true });

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });

  it('respeta la preferencia explícita', () => {
    simulateViewport({ isMobile: true });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    const { result } = renderHook(() => useViewMode({ preference: 'table' }));

    expect(result.current).toEqual({ mode: 'table', reason: 'preferencia' });
  });

  it('asume escritorio si el entorno no informa del tamaño', () => {
    // Sin matchMedia la aplicación debe seguir funcionando.
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });
});
