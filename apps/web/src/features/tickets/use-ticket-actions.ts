import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type {
  AddTicketObservationInput,
  AssignTechnicianInput,
  ChangeTicketPriorityInput,
  TicketDetail,
  TicketWorkflowStep,
} from '@redsis/contracts';
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
 * servicio de NestJS (ver AGENTS.md). Estos hooks solo piden la operación y avisan
 * a la caché.
 *
 * **Ya no envían quién ejecuta la acción.** Lo toma el backend del token: el
 * frontend no debe poder decir quién hizo algo, que es la diferencia entre una
 * auditoría y un campo de texto.
 */

export function useAssignTechnician(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, AssignTechnicianInput> {
  return useTicketAction(ticketId, (id, input: AssignTechnicianInput) =>
    ticketRepository.assignTechnician(id, input),
  );
}

export function useChangeTicketPriority(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, ChangeTicketPriorityInput> {
  return useTicketAction(ticketId, (id, input: ChangeTicketPriorityInput) =>
    ticketRepository.changePriority(id, input),
  );
}

export function useAddTicketObservation(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, AddTicketObservationInput> {
  return useTicketAction(ticketId, (id, input: AddTicketObservationInput) =>
    ticketRepository.addObservation(id, input),
  );
}

/**
 * Avanza el flujo de la intervención.
 *
 * Recibe el paso porque el botón lo conoce, pero cuál es válido lo comprueba el
 * backend: la interfaz ofrece uno solo y el servicio no confía en eso.
 */
export function useCompleteWorkflowStep(
  ticketId: string,
): UseMutationResult<TicketDetail, Error, TicketWorkflowStep> {
  return useTicketAction(ticketId, (id, step: TicketWorkflowStep) =>
    ticketRepository.completeWorkflowStep(id, step),
  );
}

/**
 * Cableado común de una acción: qué se invalida al terminar.
 *
 * Está en una función para que las cuatro acciones no puedan divergir en lo único
 * que es fácil olvidar, que es refrescar la caché entera.
 */
function useTicketAction<TInput>(
  ticketId: string,
  run: (ticketId: string, input: TInput) => Promise<TicketDetail>,
): UseMutationResult<TicketDetail, Error, TInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TInput) => run(ticketId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketsQueryKeys.all });
    },
  });
}
