import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  DataQuery,
  PaginatedResult,
  Ticket,
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
} from '@redsis/contracts';
import type { ColumnDefinition } from '@/shared/types/table';
import { buildTicketColumns } from './columns/build-ticket-columns';
import { ticketColumns as defaultTicketColumns } from './columns/ticket.columns';
import { ticketRepository } from './ticket-repository';

/** Clave de caché del módulo. Agrupada para poder invalidarla completa. */
export const ticketsQueryKeys = {
  all: ['tickets'] as const,
  list: (query: DataQuery) => ['tickets', 'list', query] as const,
  columns: () => ['tickets', 'columns'] as const,
  detail: (ticketId: string) => ['tickets', 'detail', ticketId] as const,
  timeline: (ticketId: string) => ['tickets', 'timeline', ticketId] as const,
  auditLog: (ticketId: string) => ['tickets', 'audit-log', ticketId] as const,
  technicians: () => ['tickets', 'assignable-technicians'] as const,
};

/**
 * Página de tickets.
 *
 * Los componentes nunca llaman al Repository directamente: consumen este hook, que
 * aporta caché, estados de carga y de error.
 *
 * La consulta forma parte de la clave de caché, así que cambiar de página, de orden
 * o de filtro es una consulta distinta. Con `keepPreviousData` la tabla mantiene
 * las filas mientras llega la página nueva: sin eso, cada clic en "siguiente"
 * vaciaría la tabla y daría un parpadeo que parece un fallo.
 */
export function useTickets(query: DataQuery): UseQueryResult<PaginatedResult<Ticket>, Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.list(query),
    queryFn: () => ticketRepository.list(query),
    placeholderData: keepPreviousData,
  });
}

/**
 * Columnas que declara el proyecto.
 *
 * Se consultan al origen porque cada proyecto tiene su estructura: dos tableros
 * distintos no muestran lo mismo. Mientras la respuesta llega —o si el origen no
 * sabe describirse— se usan las columnas estándar, de modo que la tabla nunca
 * queda sin cabeceras.
 *
 * El resultado se memoiza: si su identidad cambiara en cada render, el motor
 * reconstruiría las columnas y la tabla perdería su estado interno.
 */
export function useTicketColumns(): ColumnDefinition<Ticket>[] {
  const { data } = useQuery({
    queryKey: ticketsQueryKeys.columns(),
    queryFn: () => ticketRepository.describeColumns(),
    // La estructura de un proyecto no cambia mientras alguien mira la tabla.
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(
    () => (data === undefined ? defaultTicketColumns : buildTicketColumns(data)),
    [data],
  );
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
