import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PERMISSIONS, type AuthTokens, type Permission } from '@redsis/contracts';
import { DataTable } from '@/components/table';
import { TABLE_IDS } from '@/lib/table/registry';
import { getTicketRowId, ticketColumns } from '@/features/tickets/columns/ticket.columns';
import { MOCK_TICKETS } from '@/features/tickets/mocks/tickets.mock';
import { useAuthStore } from '@/stores/auth.store';

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

function authenticate(permissions: Permission[]): void {
  useAuthStore.getState().setSession(
    {
      id: 'user-1',
      email: 'admin@redsis.com',
      fullName: 'Administrador',
      isActive: true,
      roles: ['administrador'],
      permissions,
    },
    TOKENS,
  );
}

/**
 * La tabla de Tickets se monta directamente en lugar de a través del router:
 * lo que se comprueba aquí es que las columnas del módulo y los datos mock
 * producen la pantalla esperada, no el enrutado.
 */
function renderTicketsTable() {
  return render(
    <DataTable
      tableId={TABLE_IDS.TICKETS}
      columns={ticketColumns}
      data={MOCK_TICKETS}
      getRowId={getTicketRowId}
      searchPlaceholder="Buscar por ticket, cliente, sucursal..."
      emptyMessage="No hay tickets que coincidan con la búsqueda"
    />,
  );
}

function bodyRows(): HTMLElement[] {
  const [, ...rows] = screen.getAllByRole('row');
  return rows;
}

describe('Tabla de Tickets', () => {
  it('muestra las columnas del módulo', () => {
    renderTicketsTable();

    for (const header of ['Ticket', 'Cliente', 'Sucursal', 'Ciudad', 'Estado', 'Prioridad']) {
      expect(screen.getByRole('columnheader', { name: new RegExp(header) })).toBeInTheDocument();
    }
  });

  it('oculta la última actualización por decisión del módulo', () => {
    renderTicketsTable();

    expect(
      screen.queryByRole('columnheader', { name: /Última actualización/ }),
    ).not.toBeInTheDocument();
  });

  it('muestra la primera página de los 25 tickets', () => {
    renderTicketsTable();

    expect(bodyRows()).toHaveLength(25);
    expect(screen.getByText('Mostrando 1–25 de 25')).toBeInTheDocument();
  });

  it('muestra los estados con su etiqueta legible', () => {
    renderTicketsTable();

    expect(screen.getAllByText('Nuevo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('En ruta').length).toBeGreaterThan(0);
  });

  it('marca con un guion los tickets sin técnico', () => {
    renderTicketsTable();

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('busca por número de ticket', async () => {
    const user = userEvent.setup();
    renderTicketsTable();

    await user.type(screen.getByRole('searchbox'), 'INC-2026-000103');

    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText('Clínica Santa Fe')).toBeInTheDocument();
  });

  it('busca por cliente', async () => {
    const user = userEvent.setup();
    renderTicketsTable();

    await user.type(screen.getByRole('searchbox'), 'Banco Andino');

    expect(bodyRows()).toHaveLength(4);
  });

  it('avisa cuando la búsqueda no encuentra nada', async () => {
    const user = userEvent.setup();
    renderTicketsTable();

    await user.type(screen.getByRole('searchbox'), 'cliente-inexistente');

    expect(screen.getByText('No hay tickets que coincidan con la búsqueda')).toBeInTheDocument();
  });

  it('ordena por ciudad', async () => {
    const user = userEvent.setup();
    renderTicketsTable();

    await user.click(screen.getByRole('button', { name: /Ciudad/ }));

    const firstRow = bodyRows()[0];
    expect(firstRow?.textContent).toContain('Barranquilla');
  });

  it('ofrece búsqueda de columnas porque el módulo declara nueve', async () => {
    const user = userEvent.setup();
    renderTicketsTable();

    await user.click(screen.getByRole('button', { name: /Columnas/ }));

    expect(screen.getByLabelText('Buscar columna')).toBeInTheDocument();
  });
});

describe('Permiso de la pantalla de Tickets', () => {
  it('un usuario con tickets.view puede consultar', () => {
    authenticate([PERMISSIONS.TICKETS_VIEW]);

    expect(useAuthStore.getState().can(PERMISSIONS.TICKETS_VIEW)).toBe(true);
  });

  it('un usuario sin tickets.view no puede consultar', () => {
    authenticate([PERMISSIONS.USERS_VIEW]);

    expect(useAuthStore.getState().can(PERMISSIONS.TICKETS_VIEW)).toBe(false);
  });
});
