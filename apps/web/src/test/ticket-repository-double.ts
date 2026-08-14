import {
  TICKET_AUDIT_FIELDS,
  TICKET_EVENT_KINDS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  nextWorkflowStep,
  type AddTicketObservationInput,
  type AssignTechnicianInput,
  type ChangeTicketPriorityInput,
  type DataQuery,
  type PaginatedResult,
  type Ticket,
  type TicketColumnConfig,
  type TicketDetail,
  type TicketEvent,
  type TicketFieldChange,
  type TicketWorkflowStep,
} from '@redsis/contracts';
import { STANDARD_TICKET_COLUMNS } from '@redsis/contracts';
import type { TicketRepository } from '@/features/tickets/tickets.repository';
import { MOCK_TICKETS, buildTicketDetail, buildTicketPage } from './ticket-fixtures';

/**
 * Doble del Repository de Tickets para las pruebas de pantalla.
 *
 * **Simula al backend, no lo sustituye.** Guarda lo justo para que la interfaz se
 * vea coherente entre una acción y la siguiente —el técnico asignado aparece, la
 * observación entra en el timeline—, y nada más.
 *
 * No aplica ninguna regla de negocio a propósito: qué estado sigue a qué paso, qué
 * se audita y qué transiciones son válidas se prueban donde viven, que es el
 * servicio de NestJS. Repetirlas aquí crearía una segunda versión de la verdad que
 * podría quedar en desacuerdo con la real sin que ninguna prueba se enterara.
 *
 * Lo que estas pruebas comprueban es lo suyo: que la pantalla pida lo correcto y
 * dibuje lo que recibe.
 */
export function createTicketRepositoryDouble(): TicketRepository & { reset: () => void } {
  let details = seedDetails();
  let timelines = seedTimelines();
  let auditLogs = seedAuditLogs();

  function detailOrThrow(ticketId: string): TicketDetail {
    const detail = details.get(ticketId);

    if (detail === undefined) {
      throw new Error(`No existe ningún ticket con el identificador ${ticketId}.`);
    }

    return detail;
  }

  function appendEvent(ticketId: string, event: Omit<TicketEvent, 'id'>): void {
    const events = timelines.get(ticketId) ?? [];

    timelines.set(ticketId, [...events, { ...event, id: `${ticketId}-${events.length}` }]);
  }

  function update(ticketId: string, changes: Partial<TicketDetail>): TicketDetail {
    const updated = { ...detailOrThrow(ticketId), ...changes };
    details.set(ticketId, updated);

    return updated;
  }

  return {
    list: (query: DataQuery): Promise<PaginatedResult<Ticket>> =>
      Promise.resolve(buildTicketPage(MOCK_TICKETS.slice(0, query.pageSize))),

    describeColumns: (): Promise<TicketColumnConfig[]> =>
      Promise.resolve([...STANDARD_TICKET_COLUMNS]),

    findDetail: (ticketId: string): Promise<TicketDetail> => {
      try {
        return Promise.resolve(detailOrThrow(ticketId));
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    },

    findTimeline: (ticketId: string): Promise<TicketEvent[]> =>
      Promise.resolve(timelines.get(ticketId) ?? []),

    findAuditLog: (ticketId: string): Promise<TicketFieldChange[]> =>
      Promise.resolve(auditLogs.get(ticketId) ?? []),

    listAssignableTechnicians: (): Promise<string[]> =>
      Promise.resolve(['Ana Pérez', 'Carlos Ruiz', 'Luis Gómez', 'Marta Díaz']),

    assignTechnician: (ticketId: string, input: AssignTechnicianInput): Promise<TicketDetail> => {
      appendEvent(ticketId, {
        kind: TICKET_EVENT_KINDS.ASSIGNED,
        description: `Servicio asignado a ${input.technicianName}.`,
        userName: 'Quien Opera',
        occurredAt: '2026-08-01T12:00:00.000Z',
        location: null,
        attachments: [],
      });

      return Promise.resolve(update(ticketId, { technicianName: input.technicianName }));
    },

    changePriority: (ticketId: string, input: ChangeTicketPriorityInput): Promise<TicketDetail> =>
      Promise.resolve(update(ticketId, { priority: input.priority })),

    addObservation: (ticketId: string, input: AddTicketObservationInput): Promise<TicketDetail> => {
      appendEvent(ticketId, {
        kind: TICKET_EVENT_KINDS.OBSERVATION,
        description: input.note,
        userName: 'Quien Opera',
        occurredAt: '2026-08-01T12:00:00.000Z',
        location: null,
        attachments: [],
      });

      return Promise.resolve(detailOrThrow(ticketId));
    },

    completeWorkflowStep: (ticketId: string, step: TicketWorkflowStep): Promise<TicketDetail> => {
      const detail = detailOrThrow(ticketId);

      // La única comprobación que hace el doble, porque sin ella la pantalla
      // aceptaría cualquier paso y la prueba del rechazo no significaría nada.
      if (nextWorkflowStep(detail.completedSteps) !== step) {
        return Promise.reject(new Error(`El paso "${step}" no es el que corresponde ahora.`));
      }

      return Promise.resolve(
        update(ticketId, { completedSteps: [...detail.completedSteps, step] }),
      );
    },

    reset(): void {
      details = seedDetails();
      timelines = seedTimelines();
      auditLogs = seedAuditLogs();
    },
  };
}

function seedDetails(): Map<string, TicketDetail> {
  // Los pasos completados los deriva el fixture del estado del ticket: uno "en
  // ruta" cuyo técnico no hubiera salido describiría algo imposible.
  return new Map(MOCK_TICKETS.map((ticket) => [ticket.id, buildTicketDetail(ticket)]));
}

/**
 * Auditoría sembrada: la asignación del técnico y el cambio de estado.
 *
 * Los valores se guardan como el código real (`en-ruta`) y no como su etiqueta,
 * igual que hace el backend: traducirlos es presentación, y la pantalla debe
 * demostrar que sabe hacerlo.
 */
function seedAuditLogs(): Map<string, TicketFieldChange[]> {
  return new Map(
    MOCK_TICKETS.map((ticket) => {
      const changes: TicketFieldChange[] = [];

      if (ticket.technicianName !== null) {
        changes.push({
          id: `${ticket.id}-audit-tecnico`,
          field: TICKET_AUDIT_FIELDS.TECHNICIAN,
          previousValue: null,
          newValue: ticket.technicianName,
          userName: 'Coordinación',
          changedAt: ticket.createdAt,
        });
      }

      if (ticket.status !== TICKET_STATUSES.NEW) {
        changes.push({
          id: `${ticket.id}-audit-estado`,
          field: TICKET_AUDIT_FIELDS.STATUS,
          previousValue: TICKET_STATUSES.NEW,
          newValue: ticket.status,
          userName: ticket.technicianName ?? 'Coordinación',
          changedAt: ticket.updatedAt,
        });
      }

      return [ticket.id, changes];
    }),
  );
}

/** Descripción en pasado de un paso, para que el timeline sembrado sea legible. */
const STEP_DESCRIPTIONS: Record<TicketWorkflowStep, string> = {
  'confirmar-asistencia': 'Asistencia confirmada.',
  'salir-hacia-la-sucursal': 'Salida hacia la sucursal.',
  llegue: 'Llegada a la sucursal.',
  'iniciar-servicio': 'Servicio iniciado.',
  'finalizar-servicio': 'Servicio finalizado.',
  'cerrar-intervencion': 'Intervención cerrada.',
};

function seedTimelines(): Map<string, TicketEvent[]> {
  return new Map(
    MOCK_TICKETS.map((ticket) => {
      const detail = buildTicketDetail(ticket);

      const events: TicketEvent[] = [
        {
          id: `${ticket.id}-creado`,
          kind: TICKET_EVENT_KINDS.CREATED,
          description: `Ticket registrado para ${ticket.clientName}, ${ticket.branchName}.`,
          userName: 'Coordinación',
          occurredAt: ticket.createdAt,
          location: null,
          attachments: [],
        },
      ];

      for (const step of detail.completedSteps) {
        events.push({
          id: `${ticket.id}-${step}`,
          kind: TICKET_EVENT_KINDS.WORKFLOW,
          description: STEP_DESCRIPTIONS[step],
          userName: ticket.technicianName ?? 'Coordinación',
          occurredAt: ticket.updatedAt,
          location: null,
          attachments: [],
        });
      }

      if (ticket.status !== TICKET_STATUSES.NEW) {
        events.push({
          id: `${ticket.id}-estado`,
          kind: TICKET_EVENT_KINDS.STATUS_CHANGED,
          description: `El servicio pasó a ${TICKET_STATUS_LABELS[ticket.status]}.`,
          userName: ticket.technicianName ?? 'Coordinación',
          occurredAt: ticket.updatedAt,
          location: null,
          attachments: [],
        });
      }

      return [ticket.id, events];
    }),
  );
}
