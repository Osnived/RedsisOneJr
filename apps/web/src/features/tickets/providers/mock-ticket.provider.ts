import type {
  AddTicketObservationInput,
  AssignTechnicianInput,
  ChangeTicketPriorityInput,
  Ticket,
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketWorkflowStep,
} from '@redsis/contracts';
import { ticketStore } from '../mocks/ticket-store.mock';
import { MOCK_TECHNICIANS } from '../mocks/ticket-workspace.mock';
import type { TicketRepository } from '../tickets.repository';

/**
 * Implementación de `TicketRepository` sobre el origen simulado en memoria.
 *
 * Es el proveedor que se sustituirá por uno que hable con la API cuando Tickets
 * tenga módulo en NestJS y Baserow detrás. Ese cambio es este archivo y una línea
 * en `ticket-repository.ts`: ninguna pantalla, ningún hook y ninguna consulta de
 * React Query se enteran.
 *
 * Resuelve de forma asíncrona y con un retardo artificial aunque los datos estén en
 * memoria, para que las pantallas ejerciten los estados de carga y de error desde
 * ahora y no aparezcan al conectar el origen real.
 *
 * Ninguna regla vive aquí: este archivo traduce peticiones. Qué estado sigue a qué
 * paso lo decide el origen (ver `mocks/ticket-store.mock.ts`), igual que lo decidirá
 * el servicio de NestJS.
 */

/** Retardo artificial para poder ver el estado de carga. Desaparece con el origen real. */
const MOCK_LATENCY_MS = 400;

/**
 * Permite forzar un fallo desde la interfaz para comprobar el estado de error.
 * Es una herramienta de desarrollo, no una funcionalidad del negocio.
 */
export class TicketsUnavailableError extends Error {
  constructor() {
    super('No se pudo consultar los tickets. Intenta de nuevo.');
    this.name = 'TicketsUnavailableError';
  }
}

/**
 * Un identificador que no corresponde a ningún ticket.
 *
 * Es un caso normal y no un fallo del origen: llega escribiendo la URL a mano o
 * volviendo a un enlace de un ticket que ya no está. Se distingue del error de
 * disponibilidad porque la pantalla no debe invitar a reintentar algo que no
 * existe.
 */
export class TicketNotFoundError extends Error {
  constructor(ticketId: string) {
    super(`No existe ningún ticket con el identificador ${ticketId}.`);
    this.name = 'TicketNotFoundError';
  }
}

export const mockTicketProvider: TicketRepository = {
  list: (options: { shouldFail?: boolean } = {}): Promise<Ticket[]> =>
    afterLatency(() => {
      if (options.shouldFail) {
        throw new TicketsUnavailableError();
      }

      return ticketStore.listTickets();
    }),

  findDetail: (ticketId: string): Promise<TicketDetail> =>
    afterLatency(() => orNotFound(ticketStore.findDetail(ticketId), ticketId)),

  findTimeline: (ticketId: string): Promise<TicketEvent[]> =>
    afterLatency(() => orNotFound(ticketStore.findTimeline(ticketId), ticketId)),

  findAuditLog: (ticketId: string): Promise<TicketFieldChange[]> =>
    afterLatency(() => orNotFound(ticketStore.findAuditLog(ticketId), ticketId)),

  listAssignableTechnicians: (): Promise<string[]> => afterLatency(() => [...MOCK_TECHNICIANS]),

  assignTechnician: (
    ticketId: string,
    input: AssignTechnicianInput,
    actor: string,
  ): Promise<TicketDetail> =>
    afterLatency(() =>
      orNotFound(ticketStore.assignTechnician(ticketId, input.technicianName, actor), ticketId),
    ),

  changePriority: (
    ticketId: string,
    input: ChangeTicketPriorityInput,
    actor: string,
  ): Promise<TicketDetail> =>
    afterLatency(() =>
      orNotFound(ticketStore.changePriority(ticketId, input.priority, actor), ticketId),
    ),

  addObservation: (
    ticketId: string,
    input: AddTicketObservationInput,
    actor: string,
  ): Promise<TicketDetail> =>
    afterLatency(() =>
      orNotFound(ticketStore.addObservation(ticketId, input.note, actor), ticketId),
    ),

  completeWorkflowStep: (
    ticketId: string,
    step: TicketWorkflowStep,
    actor: string,
  ): Promise<TicketDetail> =>
    afterLatency(() => orNotFound(ticketStore.completeStep(ticketId, step, actor), ticketId)),
};

/**
 * Resuelve tras el retardo artificial, propagando el error si el origen lo lanza.
 *
 * Está en un solo sitio para que ninguna operación se olvide del retardo ni
 * convierta un error del origen en una promesa que nunca termina.
 */
function afterLatency<TValue>(compute: () => TValue): Promise<TValue> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(compute());
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, MOCK_LATENCY_MS);
  });
}

function orNotFound<TValue>(value: TValue | null, ticketId: string): TValue {
  if (value === null) {
    throw new TicketNotFoundError(ticketId);
  }

  return value;
}
