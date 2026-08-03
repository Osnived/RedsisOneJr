import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ALL_APP_MODULES,
  APP_MODULES,
  PERMISSIONS,
  type AppModule,
  type AuthTokens,
  type AuthenticatedUser,
} from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { ticketsRoute } from './tickets.route';

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

/**
 * La pantalla se monta sin enrutador, así que se sustituye lo único que lo
 * necesita: abrir un ticket. Que la navegación llegue de verdad a su pantalla lo
 * comprueba `ticket-navigation.spec.tsx` sobre el árbol de rutas real.
 */
const openTicket = vi.fn();

vi.mock('@/features/tickets/use-open-ticket', () => ({
  useOpenTicket: () => openTicket,
}));

/**
 * Se toma el componente de la propia ruta en lugar de reconstruir la página:
 * lo que se comprueba es que la pantalla real elige la vista, no una copia de
 * su lógica montada para la ocasión.
 */
const TicketsPage = ticketsRoute.options.component as React.ComponentType;

/**
 * La sesión se describe por sus accesos y no por su rol: desde el Sprint 0.6.1 es
 * lo único que mira la decisión de vista.
 */
function authenticateWithModules(modules: AppModule[]): void {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'persona@redsis.com',
    fullName: 'Persona',
    isActive: true,
    roles: ['un-nombre-cualquiera'],
    modules,
    permissions: [PERMISSIONS.TICKETS_VIEW],
  };

  useAuthStore.getState().setSession(user, TOKENS);
}

/** Accesos equivalentes a los que reparte la semilla. */
const FIELD_ACCESS: AppModule[] = [APP_MODULES.DASHBOARD, APP_MODULES.TICKETS, APP_MODULES.MAPS];
const SUPERVISOR_ACCESS: AppModule[] = [...FIELD_ACCESS, APP_MODULES.USERS];

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
  openTicket.mockReset();
});

describe('cambio automático de vista en Tickets', () => {
  it('en móvil, quien no administra ve las tarjetas', async () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules(FIELD_ACCESS);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('en escritorio se ve la tabla avanzada', async () => {
    simulateViewport({ isMobile: false });
    authenticateWithModules(FIELD_ACCESS);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('quien accede a Usuarios ve la tabla también en móvil', async () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules(SUPERVISOR_ACCESS);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('explica por qué muestra tarjetas', async () => {
    simulateViewport({ isMobile: true });
    authenticateWithModules(FIELD_ACCESS);

    renderTicketsPage();
    await waitForTickets();

    // Una vista que cambia sola sin explicación parece un fallo.
    expect(screen.getByText(/movil-sin-administracion/)).toBeInTheDocument();
  });

  it('no explica nada cuando muestra la tabla', async () => {
    simulateViewport({ isMobile: false });
    authenticateWithModules(FIELD_ACCESS);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.queryByText(/Vista de tarjetas/)).not.toBeInTheDocument();
  });

  it('la tabla avanzada llega con sus capacidades encendidas', async () => {
    simulateViewport({ isMobile: false });
    authenticateWithModules([...ALL_APP_MODULES]);

    renderTicketsPage();
    await waitForTickets();

    expect(screen.getByRole('toolbar', { name: 'Vistas guardadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Filtros,/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Agrupar por' })).toBeInTheDocument();
  });

  it('la tarjeta lleva al ticket, igual que la fila de la tabla', async () => {
    const user = userEvent.setup();
    simulateViewport({ isMobile: true });
    authenticateWithModules(FIELD_ACCESS);

    renderTicketsPage();
    await waitForTickets();

    const [firstCard] = screen.getAllByRole('article');
    await user.click(within(firstCard as HTMLElement).getByRole('button', { name: 'Ver detalle' }));

    // Las dos vistas comparten destino: la operación ocurre en la pantalla del
    // ticket, nunca dentro de la vista que lo lista.
    expect(openTicket).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('sin permiso no muestra ninguna vista', () => {
    simulateViewport({ isMobile: false });
    useAuthStore.getState().setSession(
      {
        id: 'user-2',
        email: 'otra@redsis.com',
        fullName: 'Otra',
        isActive: true,
        roles: ['un-nombre-cualquiera'],
        modules: [...FIELD_ACCESS],
        permissions: [],
      },
      TOKENS,
    );

    renderTicketsPage();

    expect(screen.getByText(/No tienes permiso/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
