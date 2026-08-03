import {
  TICKET_AUDIT_FIELDS,
  TICKET_EVENT_KINDS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  nextWorkflowStep,
  type Ticket,
  type TicketDetail,
  type TicketEvent,
  type TicketFieldChange,
  type TicketPriority,
  type TicketStatus,
  type TicketWorkflowStep,
} from '@redsis/contracts';
import { createId } from '@/shared/lib/create-id';
import { MOCK_TICKETS } from './tickets.mock';
import {
  buildTicketAuditLog,
  buildTicketDetail,
  buildTicketTimeline,
  describeStep,
} from './ticket-workspace.mock';

/**
 * Origen de datos simulado de Tickets.
 *
 * Hace el papel que hará Baserow: guarda el estado, aplica las reglas de una
 * operación y deja rastro de lo que cambió. Es un solo origen para todo el módulo,
 * de modo que cambiar la prioridad en el detalle también se ve en la tabla; con
 * dos copias, la pantalla parecería mentir.
 *
 * Las reglas viven aquí y no en un componente ni en un hook a propósito: React no
 * decide qué estado sigue a qué paso (ver AGENTS.md). Cuando Tickets tenga módulo
 * en NestJS, este archivo se sustituye por su servicio y estas mismas reglas se
 * mudan allí sin que la interfaz se entere.
 *
 * El estado vive en memoria: se pierde al recargar la página, igual que se perdía
 * antes de que existieran las acciones.
 */

interface TicketWorkspace {
  detail: TicketDetail;
  timeline: TicketEvent[];
  auditLog: TicketFieldChange[];
}

/**
 * Estado al que lleva cada paso del flujo, o null si no cambia la situación del
 * servicio: confirmar la asistencia y cerrar la intervención son actos del técnico
 * que no mueven el ticket.
 */
const STATUS_AFTER_STEP: Record<TicketWorkflowStep, TicketStatus | null> = {
  'confirmar-asistencia': null,
  'salir-hacia-la-sucursal': TICKET_STATUSES.ON_ROUTE,
  llegue: TICKET_STATUSES.ON_SITE,
  'iniciar-servicio': null,
  'finalizar-servicio': TICKET_STATUSES.RESOLVED,
  'cerrar-intervencion': null,
};

let workspaces = seed();

/** Se lanza cuando se intenta adelantar el flujo de la intervención. */
export class TicketStepNotAvailableError extends Error {
  constructor(step: TicketWorkflowStep) {
    super(`El paso "${step}" no es el que corresponde ahora.`);
    this.name = 'TicketStepNotAvailableError';
  }
}

export const ticketStore = {
  /** Los tickets tal como los ve una tabla: sin los campos que solo usa el detalle. */
  listTickets(): Ticket[] {
    return [...workspaces.values()].map((workspace) => toTicket(workspace.detail));
  },

  findDetail(ticketId: string): TicketDetail | null {
    return workspaces.get(ticketId)?.detail ?? null;
  },

  findTimeline(ticketId: string): TicketEvent[] | null {
    return workspaces.get(ticketId)?.timeline ?? null;
  },

  findAuditLog(ticketId: string): TicketFieldChange[] | null {
    return workspaces.get(ticketId)?.auditLog ?? null;
  },

  /**
   * Asigna el servicio a un técnico.
   *
   * Un ticket nuevo con técnico queda asignado: dejarlo como nuevo diría que nadie
   * lo ha mirado. El cambio de estado se audita como cualquier otro.
   */
  assignTechnician(ticketId: string, technicianName: string, actor: string): TicketDetail | null {
    const workspace = workspaces.get(ticketId);

    if (workspace === undefined) {
      return null;
    }

    const previous = workspace.detail.technicianName;

    record(workspace, {
      field: TICKET_AUDIT_FIELDS.TECHNICIAN,
      previousValue: previous,
      newValue: technicianName,
      actor,
    });

    add(workspace, {
      kind: TICKET_EVENT_KINDS.ASSIGNED,
      description:
        previous === null
          ? `Servicio asignado a ${technicianName}.`
          : `Servicio reasignado de ${previous} a ${technicianName}.`,
      userName: actor,
    });

    workspace.detail = { ...workspace.detail, technicianName, updatedAt: now() };

    if (workspace.detail.status === TICKET_STATUSES.NEW) {
      changeStatus(workspace, TICKET_STATUSES.ASSIGNED, actor);
    }

    return workspace.detail;
  },

  changePriority(ticketId: string, priority: TicketPriority, actor: string): TicketDetail | null {
    const workspace = workspaces.get(ticketId);

    if (workspace === undefined) {
      return null;
    }

    const previous = workspace.detail.priority;

    if (previous !== priority) {
      record(workspace, {
        field: TICKET_AUDIT_FIELDS.PRIORITY,
        previousValue: previous,
        newValue: priority,
        actor,
      });

      add(workspace, {
        kind: TICKET_EVENT_KINDS.PRIORITY_CHANGED,
        description: `Prioridad cambiada de ${TICKET_PRIORITY_LABELS[previous]} a ${TICKET_PRIORITY_LABELS[priority]}.`,
        userName: actor,
      });
    }

    workspace.detail = { ...workspace.detail, priority, updatedAt: now() };

    return workspace.detail;
  },

  /**
   * Añade una observación.
   *
   * No cambia ningún dato del ticket, así que va al timeline y no a la auditoría:
   * mezclarlas convertiría el registro de cambios en un tablón de notas.
   */
  addObservation(ticketId: string, note: string, actor: string): TicketDetail | null {
    const workspace = workspaces.get(ticketId);

    if (workspace === undefined) {
      return null;
    }

    add(workspace, {
      kind: TICKET_EVENT_KINDS.OBSERVATION,
      description: note,
      userName: actor,
    });

    workspace.detail = { ...workspace.detail, updatedAt: now() };

    return workspace.detail;
  },

  /**
   * Avanza el flujo de la intervención.
   *
   * Rechaza cualquier paso que no sea el disponible. La interfaz solo ofrece uno,
   * pero el origen no puede confiar en eso: quien decide qué transición es válida
   * es quien guarda los datos.
   */
  completeStep(ticketId: string, step: TicketWorkflowStep, actor: string): TicketDetail | null {
    const workspace = workspaces.get(ticketId);

    if (workspace === undefined) {
      return null;
    }

    if (nextWorkflowStep(workspace.detail.completedSteps) !== step) {
      throw new TicketStepNotAvailableError(step);
    }

    add(workspace, {
      kind: TICKET_EVENT_KINDS.WORKFLOW,
      description: describeStep(step),
      userName: actor,
    });

    workspace.detail = {
      ...workspace.detail,
      completedSteps: [...workspace.detail.completedSteps, step],
      updatedAt: now(),
    };

    const status = STATUS_AFTER_STEP[step];

    if (status !== null) {
      changeStatus(workspace, status, actor);
    }

    return workspace.detail;
  },

  /** Devuelve el origen a su estado inicial. Solo lo usan las pruebas. */
  reset(): void {
    workspaces = seed();
  },
};

function seed(): Map<string, TicketWorkspace> {
  return new Map(
    MOCK_TICKETS.map((ticket) => [
      ticket.id,
      {
        detail: buildTicketDetail(ticket),
        timeline: buildTicketTimeline(ticket),
        auditLog: buildTicketAuditLog(ticket),
      },
    ]),
  );
}

/**
 * Proyección de un detalle a la forma que consume una tabla.
 *
 * Se escribe campo a campo en lugar de devolver el detalle entero: así el listado
 * no arrastra dirección, zona ni categoría, y el día que el origen sea Baserow la
 * consulta de la lista no tendrá que leerlos.
 */
function toTicket(detail: TicketDetail): Ticket {
  return {
    id: detail.id,
    number: detail.number,
    clientName: detail.clientName,
    branchName: detail.branchName,
    city: detail.city,
    status: detail.status,
    priority: detail.priority,
    technicianName: detail.technicianName,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

function changeStatus(workspace: TicketWorkspace, status: TicketStatus, actor: string): void {
  const previous = workspace.detail.status;

  if (previous === status) {
    return;
  }

  record(workspace, {
    field: TICKET_AUDIT_FIELDS.STATUS,
    previousValue: previous,
    newValue: status,
    actor,
  });

  add(workspace, {
    kind: TICKET_EVENT_KINDS.STATUS_CHANGED,
    description: `El servicio pasó a ${TICKET_STATUS_LABELS[status]}.`,
    userName: actor,
  });

  workspace.detail = { ...workspace.detail, status, updatedAt: now() };
}

function add(
  workspace: TicketWorkspace,
  values: Pick<TicketEvent, 'kind' | 'description' | 'userName'>,
): void {
  workspace.timeline = [
    ...workspace.timeline,
    { id: createId(), occurredAt: now(), location: null, attachments: [], ...values },
  ];
}

function record(
  workspace: TicketWorkspace,
  values: {
    field: TicketFieldChange['field'];
    previousValue: string | null;
    newValue: string | null;
    actor: string;
  },
): void {
  workspace.auditLog = [
    ...workspace.auditLog,
    {
      id: createId(),
      field: values.field,
      previousValue: values.previousValue,
      newValue: values.newValue,
      userName: values.actor,
      changedAt: now(),
    },
  ];
}

function now(): string {
  return new Date().toISOString();
}
