import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  CUSTOM_COLUMN_SLOTS,
  STANDARD_TICKET_COLUMNS,
  TICKET_COLUMN_BINDINGS,
  TICKET_COLUMN_DATA_TYPES,
  type DataQuery,
  type Ticket,
  type TicketColumnConfig,
} from '@redsis/contracts';
import { TicketRepository } from '../ticket.repository';
import type {
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketMutation,
  TicketPage,
} from '../ticket.types';
import { applyQuery } from './in-memory-query';
import {
  MOCK_TECHNICIANS,
  buildSeedTickets,
  buildTicketAuditLog,
  buildTicketDetail,
  buildTicketTimeline,
} from './mock-tickets.seed';

/**
 * Origen de datos simulado de Tickets.
 *
 * Implementa el mismo contrato que implementarán RedsisOne, Baserow y ServiceNow,
 * y por eso sirve para algo más que rellenar pantallas: si el contrato fuera
 * incómodo para un origen real, se notaría aquí primero.
 *
 * **No contiene ninguna regla de negocio.** Guarda lo que el servicio le da y
 * responde lo que le piden. Qué estado sigue a qué paso, qué se audita y qué entra
 * en el timeline lo decide `TicketsService` (ver AGENTS.md).
 *
 * El estado vive en memoria y se pierde al reiniciar el proceso. Es lo esperado
 * mientras el origen sea simulado.
 */

interface TicketWorkspace {
  detail: TicketDetail;
  timeline: TicketEvent[];
  auditLog: TicketFieldChange[];
}

/**
 * Columnas adicionales que este proyecto declara.
 *
 * Existen para demostrar que la estructura de columnas es del proyecto y no del
 * código: tres de los veinte espacios disponibles, con el nombre visible que
 * alguien les puso. Un proyecto distinto declararía otros, o ninguno.
 */
function customColumns(): TicketColumnConfig[] {
  const [dueDateSlot, serviceTypeSlot, equipmentSlot] = CUSTOM_COLUMN_SLOTS;

  if (dueDateSlot === undefined || serviceTypeSlot === undefined || equipmentSlot === undefined) {
    throw new Error('El catálogo de columnas adicionales no puede estar vacío.');
  }

  const shared = {
    binding: TICKET_COLUMN_BINDINGS.METADATA,
    isVisible: false,
    isRequired: false,
    isGroupable: false,
  } as const;

  return [
    {
      ...shared,
      id: dueDateSlot,
      key: dueDateSlot,
      label: 'Fecha compromiso',
      type: TICKET_COLUMN_DATA_TYPES.DATE_TIME,
      order: 11,
    },
    {
      ...shared,
      id: serviceTypeSlot,
      key: serviceTypeSlot,
      label: 'Tipo de servicio',
      type: TICKET_COLUMN_DATA_TYPES.SELECT,
      order: 12,
      isGroupable: true,
    },
    {
      ...shared,
      id: equipmentSlot,
      key: equipmentSlot,
      label: 'Número de equipo',
      type: TICKET_COLUMN_DATA_TYPES.TEXT,
      order: 13,
    },
  ];
}

@Injectable()
export class MockTicketProvider extends TicketRepository {
  private workspaces = seed();

  list(query: DataQuery): Promise<TicketPage> {
    const tickets = [...this.workspaces.values()].map((workspace) => toTicket(workspace.detail));

    return Promise.resolve(applyQuery(tickets, query));
  }

  findDetail(ticketId: string): Promise<TicketDetail | null> {
    return Promise.resolve(this.workspaces.get(ticketId)?.detail ?? null);
  }

  findTimeline(ticketId: string): Promise<TicketEvent[] | null> {
    return Promise.resolve(this.workspaces.get(ticketId)?.timeline ?? null);
  }

  findAuditLog(ticketId: string): Promise<TicketFieldChange[] | null> {
    return Promise.resolve(this.workspaces.get(ticketId)?.auditLog ?? null);
  }

  describeColumns(): Promise<TicketColumnConfig[]> {
    return Promise.resolve([...STANDARD_TICKET_COLUMNS, ...customColumns()]);
  }

  listAssignableTechnicians(): Promise<string[]> {
    return Promise.resolve([...MOCK_TECHNICIANS]);
  }

  applyMutation(ticketId: string, mutation: TicketMutation): Promise<TicketDetail | null> {
    const workspace = this.workspaces.get(ticketId);

    if (workspace === undefined) {
      return Promise.resolve(null);
    }

    workspace.timeline.push({ ...mutation.event, id: randomUUID() });

    for (const change of mutation.fieldChanges) {
      workspace.auditLog.push({ ...change, id: randomUUID() });
    }

    workspace.detail = {
      ...workspace.detail,
      ...mutation.fields,
      // El instante del suceso y el de la última actualización son el mismo: dos
      // relojes distintos dejarían el timeline y el ticket discrepando por
      // milisegundos sin que eso significara nada.
      updatedAt: mutation.event.occurredAt,
    };

    return Promise.resolve(workspace.detail);
  }

  /** Devuelve el origen a su estado inicial. Solo lo usan las pruebas. */
  reset(): void {
    this.workspaces = seed();
  }
}

function seed(): Map<string, TicketWorkspace> {
  return new Map(
    buildSeedTickets().map((ticket, position) => [
      ticket.id,
      {
        detail: buildTicketDetail(ticket, position + 1),
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
 * no arrastra la dirección, la descripción larga ni la categoría, y un origen real
 * no tendrá que leer lo que ninguna tabla muestra.
 */
function toTicket(detail: TicketDetail): Ticket {
  return {
    id: detail.id,
    number: detail.number,
    title: detail.title,
    clientName: detail.clientName,
    branchName: detail.branchName,
    city: detail.city,
    zoneName: detail.zoneName,
    status: detail.status,
    priority: detail.priority,
    technicianName: detail.technicianName,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    metadata: detail.metadata,
  };
}
