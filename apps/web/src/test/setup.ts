import { afterEach, beforeEach } from 'vitest';

/**
 * Preparación común de las pruebas.
 *
 * Las pruebas de lógica pura se ejecutan en entorno `node` (más rápido, no monta
 * jsdom) y ahí no existen `document` ni `localStorage`. Por eso cada paso
 * comprueba antes si el entorno lo soporta, en lugar de asumir un navegador.
 */
const hasDom = typeof document !== 'undefined';

if (hasDom) {
  await import('@testing-library/jest-dom/vitest');
}

beforeEach(async () => {
  if (!hasDom) {
    return;
  }

  // Cada prueba parte de una sesión limpia para no depender del orden.
  localStorage.clear();

  const { useAuthStore } = await import('@/stores/auth.store');
  useAuthStore.setState({ user: null, tokens: null });
});

afterEach(async () => {
  if (!hasDom) {
    return;
  }

  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
