import type {
  Ticket,
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketPriority,
  TicketStatus,
  TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Tipos internos del módulo de Tickets.
 *
 * No viajan por la API: son el vocabulario con el que el servicio le pide cosas al
 * Repository. Lo que sale hacia el frontend son los contratos compartidos.
 */

/**
 * Campos del ticket que una operación puede modificar.
 *
 * Es deliberadamente estrecho. Un Repository que aceptara un `Partial<Ticket>`
 * dejaría cambiar el número o la fecha de creación, que no cambian nunca.
 */
export interface TicketFieldUpdate {
  status?: TicketStatus;
  priority?: TicketPriority;
  technicianName?: string | null;
  completedSteps?: TicketWorkflowStep[];
}

/**
 * Un cambio completo sobre un ticket, ya resuelto por el servicio.
 *
 * Viaja entero y no en tres llamadas porque las tres partes —lo que cambia, lo que
 * se cuenta y lo que se audita— son una sola operación: un origen que guardara el
 * dato y fallara al escribir el rastro dejaría un cambio sin trazabilidad, que es
 * exactamente lo que la plataforma no admite (ver docs/ARCHITECTURE.md).
 *
 * El Provider decide cómo lo persiste; el servicio decide qué contiene. Ninguna
 * regla de negocio vive por debajo de esta frontera.
 */
export interface TicketMutation {
  fields: TicketFieldUpdate;

  /** Entrada del timeline. Toda operación deja una. */
  event: Omit<TicketEvent, 'id'>;

  /** Cambios de datos auditados. Vacío cuando la operación no cambia ningún dato. */
  fieldChanges: Omit<TicketFieldChange, 'id'>[];
}

/** Lo que el Repository devuelve al listar: la página pedida y el total existente. */
export interface TicketPage {
  items: Ticket[];
  total: number;
}

export type { Ticket, TicketDetail, TicketEvent, TicketFieldChange };
