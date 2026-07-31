import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CreateUserInput, UpdateUserInput, UserSummary } from '@redsis/contracts';
import { usersApi } from './users.api';
import { usersQueryKeys } from './use-users';

/**
 * Mutaciones del módulo de Usuarios.
 *
 * Todas invalidan la misma clave al terminar, así que el listado se refresca solo
 * y ninguna pantalla tiene que recargar a mano.
 */

export function useCreateUser(): UseMutationResult<UserSummary, Error, CreateUserInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

export function useUpdateUser(): UseMutationResult<
  UserSummary,
  Error,
  { id: string; input: UpdateUserInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

/** Activar y suspender comparten mutación: solo cambia el valor enviado. */
export function useSetUserActive(): UseMutationResult<
  UserSummary,
  Error,
  { id: string; isActive: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.setActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}
