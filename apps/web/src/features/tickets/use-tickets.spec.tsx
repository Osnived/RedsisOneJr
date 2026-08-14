import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  STANDARD_TICKET_COLUMNS,
  TICKET_COLUMN_BINDINGS,
  TICKET_COLUMN_DATA_TYPES,
  type DataQuery,
} from '@redsis/contracts';
import { MOCK_TICKETS, buildTicketPage } from '@/test/ticket-fixtures';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/table';
import { useTicketColumns, useTickets } from './use-tickets';
import { ticketRepository } from './ticket-repository';

/**
 * Los hooks del módulo consumiendo el Repository.
 *
 * El Repository se sustituye por un doble porque detrás vive una llamada HTTP: lo
 * que se ejercita aquí es el cableado del hook —qué se pide, qué se cachea, qué se
 * entrega mientras llega la respuesta—, no la API, que tiene sus propias pruebas
 * en el backend.
 */

vi.mock('./ticket-repository', () => ({
  ticketRepository: {
    list: vi.fn(),
    describeColumns: vi.fn(),
    findDetail: vi.fn(),
    findTimeline: vi.fn(),
    findAuditLog: vi.fn(),
    listAssignableTechnicians: vi.fn(),
  },
}));

const repository = vi.mocked(ticketRepository);

const QUERY: DataQuery = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: '',
  sorting: [],
  filters: [],
};

function withQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.list.mockResolvedValue(buildTicketPage(MOCK_TICKETS.slice(0, 3)));
  repository.describeColumns.mockResolvedValue([...STANDARD_TICKET_COLUMNS]);
});

describe('useTickets', () => {
  it('empieza en estado de carga', () => {
    const { result } = renderHook(() => useTickets(QUERY), { wrapper: withQueryClient() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('entrega la página y el total al resolverse', async () => {
    const { result } = renderHook(() => useTickets(QUERY), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(3);
    expect(result.current.data?.total).toBe(3);
  });

  it('traslada la consulta completa al origen', async () => {
    // Buscar, ordenar, filtrar y paginar los resuelve el servidor: si la consulta
    // no llegara entera, la tabla mostraría resultados que no ha pedido.
    const query: DataQuery = {
      page: 2,
      pageSize: 10,
      search: 'banco',
      sorting: [{ id: 'number', desc: true }],
      filters: [{ id: 'f1', columnId: 'status', operator: 'es', value: 'nuevo' }],
    };

    renderHook(() => useTickets(query), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(repository.list).toHaveBeenCalledWith(query);
    });
  });

  it('expone el error cuando el origen falla', async () => {
    repository.list.mockRejectedValue(new Error('No se pudo consultar los tickets.'));

    const { result } = renderHook(() => useTickets(QUERY), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toMatch(/No se pudo consultar/);
  });

  it('dos consultas distintas no comparten caché', async () => {
    const wrapper = withQueryClient();
    const { result, rerender } = renderHook((query: DataQuery) => useTickets(query), {
      wrapper,
      initialProps: QUERY,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    rerender({ ...QUERY, page: 2 });

    await waitFor(() => {
      expect(repository.list).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useTicketColumns', () => {
  it('mientras llega la respuesta usa las columnas estándar', () => {
    // La tabla nunca debe quedarse sin cabeceras esperando al origen.
    const { result } = renderHook(() => useTicketColumns(), { wrapper: withQueryClient() });

    expect(result.current.length).toBe(STANDARD_TICKET_COLUMNS.length);
  });

  it('construye las columnas que declara el proyecto', async () => {
    repository.describeColumns.mockResolvedValue([
      ...STANDARD_TICKET_COLUMNS,
      {
        id: 'ColumnaAgrega1',
        key: 'ColumnaAgrega1',
        label: 'Fecha compromiso',
        binding: TICKET_COLUMN_BINDINGS.METADATA,
        type: TICKET_COLUMN_DATA_TYPES.DATE_TIME,
        isVisible: false,
        order: 11,
        isRequired: false,
        isGroupable: false,
      },
    ]);

    const { result } = renderHook(() => useTicketColumns(), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current).toHaveLength(STANDARD_TICKET_COLUMNS.length + 1);
    });

    expect(result.current.at(-1)?.header).toBe('Fecha compromiso');
  });

  it('la identidad se mantiene entre renders', async () => {
    // Si cambiara, el motor reconstruiría las columnas y la tabla perdería su
    // estado interno en cada render.
    repository.describeColumns.mockResolvedValue([
      ...STANDARD_TICKET_COLUMNS,
      {
        id: 'ColumnaAgrega1',
        key: 'ColumnaAgrega1',
        label: 'Fecha compromiso',
        binding: TICKET_COLUMN_BINDINGS.METADATA,
        type: TICKET_COLUMN_DATA_TYPES.DATE_TIME,
        isVisible: false,
        order: 11,
        isRequired: false,
        isGroupable: false,
      },
    ]);

    const wrapper = withQueryClient();
    const { result, rerender } = renderHook(() => useTicketColumns(), { wrapper });

    // Se espera a que llegue la configuración del proyecto: hasta entonces el hook
    // entrega las estándar, y comparar contra ese estado intermedio no diría nada.
    await waitFor(() => {
      expect(result.current).toHaveLength(STANDARD_TICKET_COLUMNS.length + 1);
    });

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
