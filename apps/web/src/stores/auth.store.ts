import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, AuthenticatedUser, Permission } from '@redsis/contracts';

interface AuthState {
  user: AuthenticatedUser | null;
  tokens: AuthTokens | null;
  setSession: (user: AuthenticatedUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
}

export const AUTH_STORAGE_KEY = 'redsis.auth';

/**
 * Estado de sesión del cliente.
 *
 * Zustand gestiona el estado del cliente; los datos del servidor viven en
 * TanStack Query (ver STACK.md). Aquí solo se guarda la identidad y los tokens.
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

      can: (permission) => get().user?.permissions.includes(permission) ?? false,

      canAny: (permissions) => {
        const granted = get().user?.permissions;

        if (!granted) {
          return false;
        }

        return permissions.some((permission) => granted.includes(permission));
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
    },
  ),
);
