import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MOCK_TICKETS } from './mocks/tickets.mock';
import { TicketNotFoundError, TicketsUnavailableError, ticketsApi } from './tickets.api';
import { useTicket, useTickets } from './use-tickets';

function withQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ticketsApi', () => {
  it('resuelve con los datos de prueba', async () => {
    await expect(ticketsApi.list()).resolves.toHaveLength(MOCK_TICKETS.length);
  });

  it('falla con un error propio cuando se le pide', async () => {
    await expect(ticketsApi.list({ shouldFail: true })).rejects.toBeInstanceOf(
      TicketsUnavailableError,
    );
  });

  it('el error lleva un mensaje presentable al usuario', async () => {
    await expect(ticketsApi.list({ shouldFail: true })).rejects.toThrow(
      /No se pudo consultar los tickets/,
    );
  });

  it('resuelve un solo ticket por su identificador', async () => {
    const ticket = MOCK_TICKETS[2];

    await expect(ticketsApi.getById('3')).resolves.toEqual(ticket);
  });

  it('distingue un identificador inexistente de un fallo del origen', async () => {
    await expect(ticketsApi.getById('no-existe')).rejects.toBeInstanceOf(TicketNotFoundError);
  });
});

describe('useTickets', () => {
  it('empieza en estado de carga', () => {
    const { result } = renderHook(() => useTickets(), { wrapper: withQueryClient() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('entrega los tickets al resolverse', async () => {
    const { result } = renderHook(() => useTickets(), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(MOCK_TICKETS.length);
  });

  it('expone el error cuando el origen falla', async () => {
    const { result } = renderHook(() => useTickets({ shouldFail: true }), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toMatch(/No se pudo consultar/);
  });
});

describe('useTicket', () => {
  it('entrega el ticket pedido', async () => {
    const { result } = renderHook(() => useTicket('3'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.number).toBe('INC-2026-000103');
  });

  it('expone el error cuando el ticket no existe', async () => {
    const { result } = renderHook(() => useTicket('no-existe'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toMatch(/No existe ningún ticket/);
  });
});
