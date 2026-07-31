import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Ticket } from '@redsis/contracts';
import { ticketsApi } from './tickets.api';

/** Clave de caché del módulo. Agrupada para poder invalidarla completa. */
export const ticketsQueryKeys = {
  all: ['tickets'] as const,
  list: (options: { shouldFail: boolean }) => ['tickets', 'list', options] as const,
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
