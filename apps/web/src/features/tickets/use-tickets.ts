import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Ticket } from '@redsis/contracts';
import { ticketsApi } from './tickets.api';

/** Clave de caché del módulo. Agrupada para poder invalidarla completa. */
export const ticketsQueryKeys = {
  all: ['tickets'] as const,
  list: (options: { shouldFail: boolean }) => ['tickets', 'list', options] as const,
  detail: (ticketId: string) => ['tickets', 'detail', ticketId] as const,
};

/**
 * Consulta de tickets a través de TanStack Query.
 *
 * Los componentes nunca llaman al servicio directamente: consumen este hook, que
 * aporta caché, estados de carga y de error. Es el eslabón que la arquitectura
 * define entre el servicio y el DataTable.
 */
export function useTickets({ shouldFail = false } = {}): UseQueryResult<Ticket[], Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.list({ shouldFail }),
    queryFn: () => ticketsApi.list({ shouldFail }),
  });
}

/**
 * Consulta de un solo ticket, el que sostiene su pantalla de detalle.
 *
 * Tiene su propia clave de caché y no reutiliza el listado: el detalle debe poder
 * abrirse desde una URL, y quien llega así nunca ha cargado la tabla.
 */
export function useTicket(ticketId: string): UseQueryResult<Ticket, Error> {
  return useQuery({
    queryKey: ticketsQueryKeys.detail(ticketId),
    queryFn: () => ticketsApi.getById(ticketId),
    // Mientras el origen esté en memoria no hay fallo pasajero que reintentar, y
    // un identificador inexistente no cambia por repetir la consulta: reintentar
    // solo retrasaría el mensaje. Cuando el origen sea la API, la política común
    // de `queryClient` ya distingue un 404 de un 500 y esto sobra.
    retry: false,
  });
}
