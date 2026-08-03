import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Ticket, TicketDetail, TicketEvent, TicketFieldChange } from '@redsis/contracts';
import { ticketRepository } from './ticket-repository';

/** Clave de caché del módulo. Agrupada para poder invalidarla completa. */
export const ticketsQueryKeys = {
  all: ['tickets'] as const,
  list: (options: { shouldFail: boolean }) => ['tickets', 'list', options] as const,
  detail: (ticketId: string) => ['tickets', 'detail', ticketId] as const,
  timeline: (ticketId: string) => ['tickets', 'timeline', ticketId] as const,
  auditLog: (ticketId: string) => ['tickets', 'audit-log', ticketId] as const,
  technicians: () => ['tickets', 'assignable-technicians'] as const,
};

/**
 * Consulta de tickets a través de TanStack Query.
 *
 * Los componentes nunca llaman al Repository directamente: consumen este hook, que
 * aporta caché, estados de carga y de error. Es el eslabón que la arquitectura
 * define entre el acceso a datos y el DataTable.
 */
export function useTickets({ shouldFail = false } = {}): UseQueryResult<Ticket[], Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.list({ shouldFail }),
    queryFn: () => ticketRepository.list({ shouldFail }),
  });
}

/**
 * Consulta del ticket que sostiene su espacio de trabajo.
 *
 * Tiene su propia clave de caché y no reutiliza el listado: el detalle debe poder
 * abrirse desde una URL, y quien llega así nunca ha cargado la tabla.
 */
export function useTicket(ticketId: string): UseQueryResult<TicketDetail, Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.detail(ticketId),
    queryFn: () => ticketRepository.findDetail(ticketId),
    retry: false,
  });
}

/**
 * Timeline operativo del ticket.
 *
 * Se consulta aparte del ticket porque crece sin límite y se refresca por su
 * cuenta: cada paso de la intervención añade una entrada, y no hace falta volver a
 * leer el ticket entero para verla.
 */
export function useTicketTimeline(ticketId: string): UseQueryResult<TicketEvent[], Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.timeline(ticketId),
    queryFn: () => ticketRepository.findTimeline(ticketId),
    retry: false,
  });
}

/** Registro de cambios de datos del ticket. Independiente del timeline. */
export function useTicketAuditLog(ticketId: string): UseQueryResult<TicketFieldChange[], Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.auditLog(ticketId),
    queryFn: () => ticketRepository.findAuditLog(ticketId),
    retry: false,
  });
}

/**
 * Técnicos a los que se puede asignar el servicio.
 *
 * Se consulta al abrir el ticket y no al abrir el formulario: así el desplegable
 * llega con la lista puesta en lugar de vacía durante el primer instante. La caché
 * hace que abrir varios tickets no repita la consulta.
 */
export function useAssignableTechnicians(): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.technicians(),
    queryFn: () => ticketRepository.listAssignableTechnicians(),
  });
}
