import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type {
  AddTicketObservationInput,
  AssignTechnicianInput,
  ChangeTicketPriorityInput,
  TicketDetail,
  TicketWorkflowStep,
} from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { ticketRepository } from './ticket-repository';
import { ticketsQueryKeys } from './use-tickets';

/**
 * Acciones sobre un ticket.
 *
 * Todas invalidan la clave completa del módulo: una acción cambia el ticket, su
 * timeline y su auditoría a la vez, y refrescar solo una de las tres dejaría la
 * pantalla contando una versión distinta en cada sección.
 *
 * Ninguna contiene reglas de negocio: qué estado sigue a qué paso lo decide el
 * origen de datos (ver AGENTS.md). Estos hooks solo piden la operación y avisan a
 * la caché.
 */

/**
 * Quién ejecuta la acción.
 *
 * El origen simulado necesita un nombre para firmar el timeline y la auditoría.
 * Cuando exista el backend lo tomará del token y este parámetro desaparecerá: el
 * frontend no debe poder decir quién hizo algo.
 */
function useActor(): string {
  return useAuthStore((state) => state.user?.fullName) ?? 'Sin identificar';
}

export function useAssignTechnician(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, AssignTechnicianInput> {
  return useTicketAction(ticketId, (id, input: AssignTechnicianInput, actor) =>
    ticketRepository.assignTechnician(id, input, actor),
  );
}

export function useChangeTicketPriority(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, ChangeTicketPriorityInput> {
  return useTicketAction(ticketId, (id, input: ChangeTicketPriorityInput, actor) =>
    ticketRepository.changePriority(id, input, actor),
  );
}

export function useAddTicketObservation(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, AddTicketObservationInput> {
  return useTicketAction(ticketId, (id, input: AddTicketObservationInput, actor) =>
    ticketRepository.addObservation(id, input, actor),
  );
}

/**
 * Avanza el flujo de la intervención.
 *
 * Recibe el paso porque el botón lo conoce, pero cuál es válido lo comprueba el
 * origen: la interfaz ofrece uno solo y el origen no confía en eso.
 */
export function useCompleteWorkflowStep(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, TicketWorkflowStep> {
  return useTicketAction(ticketId, (id, step: TicketWorkflowStep, actor) =>
    ticketRepository.completeWorkflowStep(id, step, actor),
  );
}

/**
 * Cableado común de una acción: quién la ejecuta y qué se invalida al terminar.
 *
 * Está en una función para que las cuatro acciones no puedan divergir en lo único
 * que es fácil olvidar, que es refrescar la caché entera.
 */
function useTicketAction<TInput>(
  ticketId: string,
  run: (ticketId: string, input: TInput, actor: string) => Promise<TicketDetail>,
): UseMutationResult<TicketDetail, Error, TInput> {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: (input: TInput) => run(ticketId, input, actor),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketsQueryKeys.all });
    },
  });
}
