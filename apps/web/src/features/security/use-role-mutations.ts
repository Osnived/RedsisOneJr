import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type {
  CreateRoleInput,
  RoleSummary,
  UpdateRoleAccessInput,
  UpdateRoleInput,
} from '@redsis/contracts';
import { securityApi } from './security.api';
import { securityQueryKeys } from './use-security';

/**
 * Mutaciones del módulo Seguridad.
 *
 * Todas invalidan la clave del módulo al terminar, así que el listado y el
 * historial se refrescan solos y ninguna pantalla recarga a mano.
 */

export function useCreateRole(): UseMutationResult<RoleSummary, Error, CreateRoleInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => securityApi.createRole(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityQueryKeys.all });
    },
  });
}

export function useUpdateRole(): UseMutationResult<
  RoleSummary,
  Error,
  { id: string; input: UpdateRoleInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      securityApi.updateRole(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityQueryKeys.all });
    },
  });
}

/** Activar y desactivar comparten mutación: solo cambia el valor enviado. */
export function useSetRoleActive(): UseMutationResult<
  RoleSummary,
  Error,
  { id: string; isActive: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      securityApi.setRoleActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityQueryKeys.all });
    },
  });
}

/**
 * Guarda módulos, permisos y motivo en una sola operación.
 *
 * Es una sola mutación porque en el backend es una sola transacción: partirla en
 * dos dejaría la puerta abierta a guardar accesos sin auditoría.
 */
export function useUpdateRoleAccess(): UseMutationResult<
  RoleSummary,
  Error,
  { id: string; input: UpdateRoleAccessInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleAccessInput }) =>
      securityApi.updateRoleAccess(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityQueryKeys.all });
    },
  });
}
