import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth.store';

beforeEach(() => {
  // Cada prueba parte de una sesión limpia para no depender del orden.
  localStorage.clear();
  useAuthStore.setState({ user: null, tokens: null });
});

afterEach(() => {
  cleanup();
});
