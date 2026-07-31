import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MOCK_TICKETS } from './mocks/tickets.mock';
import { TicketsUnavailableError, ticketsApi } from './tickets.api';
import { useTickets } from './use-tickets';

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
