import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  TICKET_AUDIT_FIELDS,
  TICKET_EVENT_KINDS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  buildPaginatedResult,
  nextWorkflowStep,
  type AddTicketObservationInput,
  type AssignTechnicianInput,
  type ChangeTicketPriorityInput,
  type DataQuery,
  type PaginatedResult,
  type Ticket,
  type TicketColumnConfig,
  type TicketPriority,
  type TicketStatus,
  type TicketWorkflowStep,
} from '@redsis/contracts';
import { TicketProviderRegistry } from './ticket-provider.registry';
import type { TicketDetail, TicketEvent, TicketFieldChange, TicketMutation } from './ticket.types';

/**
 * Reglas de negocio de Tickets.
 *
 * Aquí vive **todo** lo que decide qué ocurre: qué estado sigue a qué paso, qué se
 * audita, qué entra en el timeline y qué transiciones se aceptan. Un Provider solo
 * guarda lo que este servicio resuelve, así que cambiar de origen de datos no
 * puede cambiar el comportamiento del negocio (ver AGENTS.md).
 *
 * Estas reglas estuvieron en el origen simulado del frontend mientras Tickets no
 * tuvo módulo en la API. Se mudaron sin alterarlas: era el sitio previsto desde
 * que se escribieron.
 */

/** Quién ejecuta una operación. El nombre es para mostrar, el identificador para trazar. */
export interface TicketActor {
  id: string;

  /**
   * Nombre con el que aparece en el timeline.
   *
   * Hoy llega el correo porque el token todavía no transporta el nombre completo.
   * Cuando lo haga, cambia el controlador y no este servicio.
   */
  name: string;
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

/** Descripción en pasado de un paso del flujo, para el timeline. */
const STEP_DESCRIPTIONS: Record<TicketWorkflowStep, string> = {
  'confirmar-asistencia': 'Asistencia confirmada.',
  'salir-hacia-la-sucursal': 'Salida hacia la sucursal.',
  llegue: 'Llegada a la sucursal.',
  'iniciar-servicio': 'Servicio iniciado.',
  'finalizar-servicio': 'Servicio finalizado.',
  'cerrar-intervencion': 'Intervención cerrada.',
};

@Injectable()
export class TicketsService {
  constructor(private readonly registry: TicketProviderRegistry) {}

  async list(query: DataQuery): Promise<PaginatedResult<Ticket>> {
    const { items, total } = await this.repository().list(query);

    return buildPaginatedResult(items, total, { page: query.page, pageSize: query.pageSize });
  }

  async findDetail(ticketId: string): Promise<TicketDetail> {
    return this.orNotFound(await this.repository().findDetail(ticketId), ticketId);
  }

  async findTimeline(ticketId: string): Promise<TicketEvent[]> {
    return this.orNotFound(await this.repository().findTimeline(ticketId), ticketId);
  }

  async findAuditLog(ticketId: string): Promise<TicketFieldChange[]> {
    return this.orNotFound(await this.repository().findAuditLog(ticketId), ticketId);
  }

  /** Estructura de columnas de la fuente activa. La declara el proyecto, no el código. */
  describeColumns(): Promise<TicketColumnConfig[]> {
    return this.repository().describeColumns();
  }

  listAssignableTechnicians(): Promise<string[]> {
    return this.repository().listAssignableTechnicians();
  }

  /**
   * Asigna el servicio a un técnico.
   *
   * Un ticket nuevo con técnico queda asignado: dejarlo como nuevo diría que nadie
   * lo ha mirado. El cambio de estado se audita como cualquier otro, así que la
   * operación puede dejar dos entradas de auditoría y una sola del timeline.
   */
  async assignTechnician(
    ticketId: string,
    input: AssignTechnicianInput,
    actor: TicketActor,
  ): Promise<TicketDetail> {
    const detail = await this.findDetail(ticketId);
    const occurredAt = this.now();
    const previous = detail.technicianName;
    const technicianName = input.technicianName;

    const fieldChanges: Omit<TicketFieldChange, 'id'>[] = [
      {
        field: TICKET_AUDIT_FIELDS.TECHNICIAN,
        previousValue: previous,
        newValue: technicianName,
        userName: actor.name,
        changedAt: occurredAt,
      },
    ];

    const fields: TicketMutation['fields'] = { technicianName };

    if (detail.status === TICKET_STATUSES.NEW) {
      fields.status = TICKET_STATUSES.ASSIGNED;
      fieldChanges.push({
        field: TICKET_AUDIT_FIELDS.STATUS,
        previousValue: detail.status,
        newValue: TICKET_STATUSES.ASSIGNED,
        userName: actor.name,
        changedAt: occurredAt,
      });
    }

    return this.apply(ticketId, {
      fields,
      event: {
        kind: TICKET_EVENT_KINDS.ASSIGNED,
        description:
          previous === null
            ? `Servicio asignado a ${technicianName}.`
            : `Servicio reasignado de ${previous} a ${technicianName}.`,
        userName: actor.name,
        occurredAt,
        location: null,
        attachments: [],
      },
      fieldChanges,
    });
  }

  /**
   * Cambia la prioridad.
   *
   * Asignar la prioridad que ya tenía no deja rastro: una auditoría llena de
   * cambios que no cambiaron nada deja de servir para auditar.
   */
  async changePriority(
    ticketId: string,
    input: ChangeTicketPriorityInput,
    actor: TicketActor,
  ): Promise<TicketDetail> {
    const detail = await this.findDetail(ticketId);

    if (detail.priority === input.priority) {
      return detail;
    }

    const occurredAt = this.now();

    return this.apply(ticketId, {
      fields: { priority: input.priority },
      event: {
        kind: TICKET_EVENT_KINDS.PRIORITY_CHANGED,
        description: this.describePriorityChange(detail.priority, input.priority),
        userName: actor.name,
        occurredAt,
        location: null,
        attachments: [],
      },
      fieldChanges: [
        {
          field: TICKET_AUDIT_FIELDS.PRIORITY,
          previousValue: detail.priority,
          newValue: input.priority,
          userName: actor.name,
          changedAt: occurredAt,
        },
      ],
    });
  }

  /**
   * Añade una observación.
   *
   * No cambia ningún dato del ticket, así que va al timeline y no a la auditoría:
   * mezclarlas convertiría el registro de cambios en un tablón de notas.
   */
  async addObservation(
    ticketId: string,
    input: AddTicketObservationInput,
    actor: TicketActor,
  ): Promise<TicketDetail> {
    await this.findDetail(ticketId);

    return this.apply(ticketId, {
      fields: {},
      event: {
        kind: TICKET_EVENT_KINDS.OBSERVATION,
        description: input.note,
        userName: actor.name,
        occurredAt: this.now(),
        location: null,
        attachments: [],
      },
      fieldChanges: [],
    });
  }

  /**
   * Avanza el flujo de la intervención.
   *
   * Rechaza cualquier paso que no sea el disponible. La interfaz solo ofrece uno,
   * pero el servicio no puede confiar en eso: quien decide qué transición es válida
   * es quien guarda los datos, no quien dibuja el botón.
   */
  async completeWorkflowStep(
    ticketId: string,
    step: TicketWorkflowStep,
    actor: TicketActor,
  ): Promise<TicketDetail> {
    const detail = await this.findDetail(ticketId);
    const expected = nextWorkflowStep(detail.completedSteps);

    if (expected !== step) {
      throw new ConflictException(
        expected === null
          ? 'La intervención ya está cerrada.'
          : `El paso "${step}" no es el que corresponde ahora.`,
      );
    }

    const occurredAt = this.now();
    const status = STATUS_AFTER_STEP[step];
    const fields: TicketMutation['fields'] = {
      completedSteps: [...detail.completedSteps, step],
    };

    const fieldChanges: Omit<TicketFieldChange, 'id'>[] = [];

    if (status !== null && status !== detail.status) {
      fields.status = status;
      fieldChanges.push({
        field: TICKET_AUDIT_FIELDS.STATUS,
        previousValue: detail.status,
        newValue: status,
        userName: actor.name,
        changedAt: occurredAt,
      });
    }

    return this.apply(ticketId, {
      fields,
      event: {
        kind: TICKET_EVENT_KINDS.WORKFLOW,
        description: STEP_DESCRIPTIONS[step],
        userName: actor.name,
        occurredAt,
        location: null,
        attachments: [],
      },
      fieldChanges,
    });
  }

  private describePriorityChange(previous: TicketPriority, next: TicketPriority): string {
    return `Prioridad cambiada de ${TICKET_PRIORITY_LABELS[previous]} a ${TICKET_PRIORITY_LABELS[next]}.`;
  }

  private async apply(ticketId: string, mutation: TicketMutation): Promise<TicketDetail> {
    return this.orNotFound(await this.repository().applyMutation(ticketId, mutation), ticketId);
  }

  private repository() {
    return this.registry.active();
  }

  private now(): string {
    return new Date().toISOString();
  }

  /**
   * Un identificador desconocido es un caso normal, no un fallo del origen: llega
   * escribiendo la URL a mano o desde el enlace de un ticket que ya no está.
   */
  private orNotFound<TValue>(value: TValue | null, ticketId: string): TValue {
    if (value === null) {
      throw new NotFoundException(`No existe ningún ticket con el identificador ${ticketId}.`);
    }

    return value;
  }
}
