import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  APP_MODULES,
  type AppModule,
  type AuthTokens,
  type AuthenticatedUser,
} from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { useViewMode } from './use-view-mode';

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

/**
 * La sesión se describe por sus accesos, no por su rol: es exactamente lo que
 * comprueba este hook desde el Sprint 0.6.1.
 */
function authenticateWithModules(modules: AppModule[]): void {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'persona@redsis.com',
    fullName: 'Persona',
    isActive: true,
    roles: ['un-nombre-cualquiera'],
    modules,
    permissions: [],
  };

  useAuthStore.getState().setSession(user, TOKENS);
}

/** `matchMedia` no existe en jsdom, así que se declara para la prueba. */
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
  it('devuelve tarjetas en móvil a quien no administra', () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules([APP_MODULES.DASHBOARD, APP_MODULES.TICKETS]);

    const { result } = renderHook(() => useViewMode());

    expect(result.current).toEqual({ mode: 'cards', reason: 'movil-sin-administracion' });
  });

  it('devuelve la tabla en escritorio', () => {
    simulateViewport({ isMobile: false });
    authenticateWithModules([APP_MODULES.TICKETS]);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });

  it('devuelve la tabla a quien accede a Usuarios, incluso en móvil', () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules([APP_MODULES.TICKETS, APP_MODULES.USERS]);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });

  it('devuelve la tabla a quien accede a Seguridad, incluso en móvil', () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules([APP_MODULES.TICKETS, APP_MODULES.SECURITY]);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });

  it('no depende del nombre del rol', () => {
    // Dos sesiones con el mismo acceso y roles distintos deciden igual.
    simulateViewport({ isMobile: true });

    authenticateWithModules([APP_MODULES.TICKETS]);
    const conUnNombre = renderHook(() => useViewMode()).result.current;

    useAuthStore.getState().setSession(
      {
        id: 'user-2',
        email: 'otra@redsis.com',
        fullName: 'Otra',
        isActive: true,
        roles: ['administrador'],
        modules: [APP_MODULES.TICKETS],
        permissions: [],
      },
      TOKENS,
    );
    const conOtroNombre = renderHook(() => useViewMode()).result.current;

    expect(conOtroNombre).toEqual(conUnNombre);
  });

  it('sin sesión decide como quien no administra', () => {
    simulateViewport({ isMobile: true });

    const { result } = renderHook(() => useViewMode());

    // Sin sesión no hay accesos, así que no administra. Nadie llega a verlo: sin
    // sesión la aplicación redirige al login.
    expect(result.current.mode).toBe('cards');
  });

  it('respeta la preferencia explícita', () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules([APP_MODULES.TICKETS]);

    const { result } = renderHook(() => useViewMode({ preference: 'table' }));

    expect(result.current).toEqual({ mode: 'table', reason: 'preferencia' });
  });

  it('asume escritorio si el entorno no informa del tamaño', () => {
    authenticateWithModules([APP_MODULES.TICKETS]);

    const { result } = renderHook(() => useViewMode());

    expect(result.current.mode).toBe('table');
  });
});
