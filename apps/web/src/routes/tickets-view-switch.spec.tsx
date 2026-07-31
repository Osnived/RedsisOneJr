import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PERMISSIONS,
  SYSTEM_ROLES,
  type AuthTokens,
  type AuthenticatedUser,
} from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { ticketsRoute } from './tickets.route';

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

/**
 * Se toma el componente de la propia ruta en lugar de reconstruir la página:
 * lo que se comprueba es que la pantalla real elige la vista, no una copia de
 * su lógica montada para la ocasión.
 */
const TicketsPage = ticketsRoute.options.component as React.ComponentType;

function authenticateWithRole(role: string): void {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'persona@redsis.com',
    fullName: 'Persona',
    isActive: true,
    roles: [role],
    permissions: [PERMISSIONS.TICKETS_VIEW],
  };

  useAuthStore.getState().setSession(user, TOKENS);
}

/** `matchMedia` no existe en jsdom: hay que declararlo para simular el móvil. */
function simulateViewport({ isMobile }: { isMobile: boolean }): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: isMobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderTicketsPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <TicketsPage />
    </QueryClientProvider>,
  );
}

/** Espera a que los tickets estén en pantalla, en cualquiera de las dos vistas. */
async function waitForTickets(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByText(/incidentes registrados/)).toBeInTheDocument();
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cambio automático de vista en Tickets', () => {
  it('un técnico en móvil ve las tarjetas', async () => {
    simulateViewport({ isMobile: true });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('un técnico en escritorio ve la tabla avanzada', async () => {
    simulateViewport({ isMobile: false });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('un supervisor en móvil ve la tabla avanzada', async () => {
    simulateViewport({ isMobile: true });
    authenticateWithRole(SYSTEM_ROLES.SUPERVISOR);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('explica por qué muestra tarjetas', async () => {
    simulateViewport({ isMobile: true });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    renderTicketsPage();
    await waitForTickets();

    // Una vista que cambia sola sin explicación parece un fallo.
    expect(screen.getByText(/tecnico-en-movil/)).toBeInTheDocument();
  });

  it('no explica nada cuando muestra la tabla', async () => {
    simulateViewport({ isMobile: false });
    authenticateWithRole(SYSTEM_ROLES.TECHNICIAN);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.queryByText(/Vista de tarjetas/)).not.toBeInTheDocument();
  });

  it('la tabla avanzada llega con sus capacidades encendidas', async () => {
    simulateViewport({ isMobile: false });
    authenticateWithRole(SYSTEM_ROLES.ADMINISTRATOR);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getByRole('toolbar', { name: 'Vistas guardadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Filtros,/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Agrupar por' })).toBeInTheDocument();
  });

  it('sin permiso no muestra ninguna vista', () => {
    simulateViewport({ isMobile: false });
    useAuthStore.getState().setSession(
      {
        id: 'user-2',
        email: 'otra@redsis.com',
        fullName: 'Otra',
        isActive: true,
        roles: [SYSTEM_ROLES.TECHNICIAN],
        permissions: [],
      },
      TOKENS,
    );

    renderTicketsPage();

    expect(screen.getByText(/No tienes permiso/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
