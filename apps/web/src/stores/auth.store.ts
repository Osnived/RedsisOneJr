import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, AuthenticatedUser } from '@redsis/contracts';

interface AuthState {
  user: AuthenticatedUser | null;
  tokens: AuthTokens | null;
  setSession: (user: AuthenticatedUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

export const AUTH_STORAGE_KEY = 'redsis.auth';

/** Formato de la sesión guardada. Se incrementa cuando cambia su forma. */
export const AUTH_STORAGE_VERSION = 2;

/**
 * Estado de sesión del cliente.
 *
 * Zustand gestiona el estado del cliente; los datos del servidor viven en
 * TanStack Query (ver STACK.md). Aquí solo se guarda la identidad y los tokens.
 *
 * Guarda la sesión y nada más. Las preguntas de autorización no se responden
 * aquí: para eso existe `useAuthorization`, que es la única vía (ver AGENTS.md).
 * Tenerlas en el store invitaría a leer `user.permissions` desde cualquier sitio.
 *
 * Los tokens se persisten en localStorage para sobrevivir a un refresco de
 * página. El access token dura pocos minutos y el refresh es rotativo, así que
 * un token filtrado tiene ventana corta y deja de servir al primer uso legítimo.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,

      setSession: (user, tokens) => set({ user, tokens }),

      setTokens: (tokens) => set({ tokens }),

      clearSession: () => set({ user: null, tokens: null }),

      isAuthenticated: () => get().tokens !== null && get().user !== null,
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),

      /**
       * Historial del formato guardado:
       * - 1: usuario con roles y permisos.
       * - 2: el usuario incluye los módulos a los que accede.
       */
      version: AUTH_STORAGE_VERSION,

      /**
       * Una sesión de un formato anterior se descarta.
       *
       * Un usuario guardado sin `modules` no tendría acceso a ningún módulo, así
       * que vería 403 en toda la aplicación sin entender por qué. Es mejor pedirle
       * que entre de nuevo una vez: al hacerlo, el token llega completo.
       */
      migrate: () => ({ user: null, tokens: null }),
    },
  ),
);
