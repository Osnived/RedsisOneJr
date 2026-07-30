import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

/**
 * Configuración compartida de TanStack Query.
 *
 * No se reintentan los errores 4xx: un 403 o un 404 no cambian por repetir la
 * petición, y reintentarlos solo retrasa el mensaje al usuario.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode < 500) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
