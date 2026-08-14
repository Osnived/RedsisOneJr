import type {
  AddTicketObservationInput,
  AssignTechnicianInput,
  ChangeTicketPriorityInput,
  DataQuery,
  PaginatedResult,
  Ticket,
  TicketColumnConfig,
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketWorkflowStep,
} from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';
import type { TicketRepository } from '../tickets.repository';

/**
 * Implementación de `TicketRepository` sobre la API de la plataforma.
 *
 * Es lo más lejos que llega el frontend: pide a NestJS y devuelve contratos. Qué
 * origen atiende al otro lado —el simulado, RedsisOne, Baserow, ServiceNow— no
 * aparece por ninguna parte de este archivo, y ese es exactamente el objetivo
 * (ver AGENTS.md).
 *
 * No hay un servicio `tickets.api.ts` intermedio a propósito: sería una capa sin
 * contenido entre este proveedor y `apiClient`. El Provider **es** el servicio de
 * datos del módulo.
 */
export const httpTicketProvider: TicketRepository = {
  list: (query: DataQuery): Promise<PaginatedResult<Ticket>> =>
    apiClient.get<PaginatedResult<Ticket>>(`/tickets?${toSearchParams(query)}`),

  describeColumns: (): Promise<TicketColumnConfig[]> =>
    apiClient.get<TicketColumnConfig[]>('/tickets/columns'),

  findDetail: (ticketId: string): Promise<TicketDetail> =>
    apiClient.get<TicketDetail>(`/tickets/${encodeURIComponent(ticketId)}`),

  findTimeline: (ticketId: string): Promise<TicketEvent[]> =>
    apiClient.get<TicketEvent[]>(`/tickets/${encodeURIComponent(ticketId)}/timeline`),

  findAuditLog: (ticketId: string): Promise<TicketFieldChange[]> =>
    apiClient.get<TicketFieldChange[]>(`/tickets/${encodeURIComponent(ticketId)}/audit-log`),

  listAssignableTechnicians: (): Promise<string[]> =>
    apiClient.get<string[]>('/tickets/technicians'),

  assignTechnician: (ticketId: string, input: AssignTechnicianInput): Promise<TicketDetail> =>
    apiClient.patch<TicketDetail>(`/tickets/${encodeURIComponent(ticketId)}/technician`, input),

  changePriority: (ticketId: string, input: ChangeTicketPriorityInput): Promise<TicketDetail> =>
    apiClient.patch<TicketDetail>(`/tickets/${encodeURIComponent(ticketId)}/priority`, input),

  addObservation: (ticketId: string, input: AddTicketObservationInput): Promise<TicketDetail> =>
    apiClient.post<TicketDetail>(`/tickets/${encodeURIComponent(ticketId)}/observations`, input),

  completeWorkflowStep: (ticketId: string, step: TicketWorkflowStep): Promise<TicketDetail> =>
    apiClient.post<TicketDetail>(`/tickets/${encodeURIComponent(ticketId)}/workflow`, { step }),
};

/**
 * Traduce la consulta a parámetros de la URL.
 *
 * El orden viaja como dos parámetros y no como una lista porque ninguna pantalla
 * ordena hoy por más de una columna, y una URL con orden múltiple sería ilegible.
 * Los filtros van como JSON: son lo único que no cabe plano.
 *
 * Los parámetros vacíos se omiten para que la URL de una consulta sin filtros sea
 * corta y legible, y para que dos consultas equivalentes produzcan la misma clave
 * de caché.
 */
function toSearchParams(query: DataQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.search.trim().length > 0) {
    params.set('search', query.search.trim());
  }

  const [sort] = query.sorting;

  if (sort !== undefined) {
    params.set('sortBy', sort.id);
    params.set('sortDesc', String(sort.desc));
  }

  if (query.filters.length > 0) {
    params.set('filters', JSON.stringify(query.filters));
  }

  return params.toString();
}
