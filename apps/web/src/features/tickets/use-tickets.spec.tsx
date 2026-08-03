import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MOCK_TICKETS } from './mocks/tickets.mock';
import { ticketStore } from './mocks/ticket-store.mock';
import { useTicket, useTicketAuditLog, useTicketTimeline, useTickets } from './use-tickets';

/**
 * Los hooks del módulo consumiendo el Repository.
 *
 * No mockean el origen: ejercitan el camino completo que usará la pantalla
 * —hook, contrato, proveedor, origen— porque es justo ese cableado el que no debe
 * romperse al sustituir el proveedor.
 */

function withQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  ticketStore.reset();
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

    expect(result.current.error?.message).toMatch(/No se pudo consultar/);
  });
});

describe('useTicket', () => {
  it('entrega el ticket pedido, con los campos del detalle', async () => {
    const { result } = renderHook(() => useTicket('3'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.number).toBe('INC-2026-000103');
    expect(result.current.data?.zoneName).toBe('Zona Antioquia');
  });

  it('expone el error cuando el ticket no existe', async () => {
    const { result } = renderHook(() => useTicket('no-existe'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toMatch(/No existe ningún ticket/);
  });
});

describe('useTicketTimeline y useTicketAuditLog', () => {
  it('el timeline llega en orden, de lo más antiguo a lo más reciente', async () => {
    const { result } = renderHook(() => useTicketTimeline('3'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const events = result.current.data ?? [];

    expect(events.length).toBeGreaterThan(1);
    expect(events[0]?.kind).toBe('creado');
  });

  it('la auditoría se consulta por separado del timeline', async () => {
    const { result } = renderHook(() => useTicketAuditLog('3'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Un ticket en ruta con técnico tiene al menos su asignación registrada.
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
