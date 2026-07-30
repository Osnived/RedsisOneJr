import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { LoginInput } from '@redsis/contracts';
import { authApi } from './auth.api';
import { useAuthStore } from '@/stores/auth.store';

/** Inicia sesión y guarda la sesión resultante en el store del cliente. */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (response) => {
      setSession(response.user, response.tokens);
      void navigate({ to: '/' });
    },
  });
}

/**
 * Cierra la sesión.
 *
 * La sesión local se limpia aunque la petición al servidor falle: si el usuario
 * pidió salir, debe quedar fuera de la aplicación en cualquier caso.
 */
export function useLogout() {
  // Zustand v5 no compara por igualdad superficial: cada valor se selecciona
  // por separado para no provocar renders infinitos.
  const tokens = useAuthStore((state) => state.tokens);
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (tokens?.refreshToken) {
        await authApi.logout(tokens.refreshToken);
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      void navigate({ to: '/login' });
    },
  });
}
