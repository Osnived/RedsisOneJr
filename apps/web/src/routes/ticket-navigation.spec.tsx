import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { ALL_APP_MODULES, PERMISSIONS, type AuthTokens, type Permission } from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { routeTree } from './index';

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

/** Un ticket de la semilla de datos de prueba, con técnico asignado. */
const TICKET = { id: '3', number: 'INC-2026-000103' };

/**
 * Estas pruebas montan la aplicación entera y esperan dos consultas seguidas, cada
 * una con el retardo artificial del origen en memoria. Con la suite completa
 * corriendo en paralelo, montar jsdom y el árbol de rutas tarda bastante más que
 * los márgenes por omisión —un segundo para cada espera, cinco para cada prueba—,
 * así que se declaran holgados: en una ejecución normal ninguna llega a agotarlos.
 */
const WAIT = { timeout: 15_000 };
const TEST_TIMEOUT = 30_000;

function authenticate(permissions: Permission[] = [PERMISSIONS.TICKETS_VIEW]): void {
  useAuthStore.getState().setSession(
    {
      id: 'user-1',
      email: 'persona@redsis.com',
      fullName: 'Persona',
      isActive: true,
      roles: ['un-nombre-cualquiera'],
      modules: ALL_APP_MODULES.slice(),
      permissions,
    },
    TOKENS,
  );
}

/**
 * Monta la aplicación real sobre el árbol de rutas real, en la dirección pedida.
 *
 * Aquí sí se pasa por el enrutador —al contrario que las pruebas de la tabla, que
 * montan la pantalla directamente— porque lo que se comprueba es precisamente la
 * navegación: que la fila lleva a una URL y que esa URL dibuja el ticket.
 */
function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

describe('Navegación al espacio de trabajo del ticket', { timeout: TEST_TIMEOUT }, () => {
  it('la fila de la tabla lleva a la pantalla del ticket', async () => {
    const user = userEvent.setup();
    authenticate();

    const router = renderAt('/tickets');

    const row = await screen.findByRole('row', { name: `Abrir el ticket ${TICKET.number}` }, WAIT);
    await user.click(row);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/tickets/${TICKET.id}`);
    }, WAIT);

    expect(await screen.findByRole('heading', { name: TICKET.number }, WAIT)).toBeInTheDocument();
  });

  it('el ticket se abre escribiendo su dirección, sin pasar por la tabla', async () => {
    authenticate();

    renderAt(`/tickets/${TICKET.id}`);

    expect(await screen.findByRole('heading', { name: TICKET.number }, WAIT)).toBeInTheDocument();
  });

  it('avisa cuando la dirección no corresponde a ningún ticket', async () => {
    authenticate();

    renderAt('/tickets/no-existe');

    expect(await screen.findByRole('alert', {}, WAIT)).toHaveTextContent(/No existe ningún ticket/);
  });

  it('ofrece la vuelta a la tabla', async () => {
    authenticate();

    renderAt(`/tickets/${TICKET.id}`);

    expect(await screen.findByRole('link', { name: /Volver a Tickets/ }, WAIT)).toHaveAttribute(
      'href',
      '/tickets',
    );
  });

  it('sin permiso para consultar tickets no muestra el ticket', async () => {
    authenticate([PERMISSIONS.USERS_VIEW]);

    renderAt(`/tickets/${TICKET.id}`);

    expect(
      await screen.findByText(/No tienes permiso para consultar tickets/, {}, WAIT),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: TICKET.number })).not.toBeInTheDocument();
  });
});
