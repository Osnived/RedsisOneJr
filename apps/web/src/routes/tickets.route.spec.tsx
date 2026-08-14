import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALL_APP_MODULES, PERMISSIONS, type AuthTokens, type Permission } from '@redsis/contracts';
import { AdvancedTable, DataTable } from '@/shared/components/table';
import { createAuthorizationService } from '@/shared/lib/authorization';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getTicketRowId, ticketColumns } from '@/features/tickets/columns/ticket.columns';
import { MOCK_TICKETS } from '@/test/ticket-fixtures';
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
      modules: ALL_APP_MODULES.slice(),
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

/**
 * Capacidades que la pantalla enciende. Se declaran aquí igual que en la ruta:
 * si alguien las apaga por error, estas pruebas lo detectan.
 */
function renderAdvancedTicketsTable() {
  return render(
    <AdvancedTable
      tableId={TABLE_IDS.TICKETS}
      columns={ticketColumns}
      data={MOCK_TICKETS}
      getRowId={getTicketRowId}
      searchPlaceholder="Buscar por ticket, cliente, sucursal..."
      emptyMessage="No hay tickets que coincidan con la búsqueda"
      capabilities={{ views: true, columnSettings: true, grouping: true, filters: true }}
    />,
  );
}

describe('Tickets con AdvancedTable', () => {
  it('conserva todo lo que ya hacía con el BaseTable', () => {
    renderAdvancedTicketsTable();

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Ticket/ })).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(25);
  });

  it('ofrece la barra de vistas', () => {
    renderAdvancedTicketsTable();

    expect(screen.getByRole('toolbar', { name: 'Vistas guardadas' })).toBeInTheDocument();
  });

  it('ofrece el constructor de filtros', () => {
    renderAdvancedTicketsTable();

    expect(screen.getByRole('button', { name: /^Filtros,/ })).toBeInTheDocument();
  });

  it('agrupa por estado, técnico, prioridad y ciudad', () => {
    renderAdvancedTicketsTable();

    const selector = screen.getByRole('combobox', { name: 'Agrupar por' });

    for (const label of ['Estado', 'Técnico', 'Prioridad', 'Ciudad']) {
      expect(within(selector).getByRole('option', { name: label })).toBeInTheDocument();
    }
  });

  it('no permite agrupar por el número de ticket', () => {
    renderAdvancedTicketsTable();

    const selector = screen.getByRole('combobox', { name: 'Agrupar por' });

    // Daría un grupo por fila.
    expect(within(selector).queryByRole('option', { name: 'Ticket' })).not.toBeInTheDocument();
  });

  it('agrupa mostrando la etiqueta del estado, no su código', async () => {
    const user = userEvent.setup();
    renderAdvancedTicketsTable();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Agrupar por' }), 'status');

    expect(screen.getByRole('button', { name: /^Grupo En ruta/ })).toBeInTheDocument();
  });

  it('abre el panel de columnas en lugar del desplegable', async () => {
    const user = userEvent.setup();
    renderAdvancedTicketsTable();

    await user.click(screen.getByRole('button', { name: /^Columnas,/ }));

    expect(
      screen.getByRole('complementary', { name: 'Configuración de columnas' }),
    ).toBeInTheDocument();
  });
});

describe('Permiso de la pantalla de Tickets', () => {
  /** La decisión se consulta al servicio, que es la única vía (ver AGENTS.md). */
  function authorizationOfSession() {
    const user = useAuthStore.getState().user;

    return createAuthorizationService({
      modules: user?.modules ?? [],
      permissions: user?.permissions ?? [],
    });
  }

  it('un usuario con tickets.view puede consultar', () => {
    authenticate([PERMISSIONS.TICKETS_VIEW]);

    expect(authorizationOfSession().can(PERMISSIONS.TICKETS_VIEW)).toBe(true);
  });

  it('un usuario sin tickets.view no puede consultar', () => {
    authenticate([PERMISSIONS.USERS_VIEW]);

    expect(authorizationOfSession().can(PERMISSIONS.TICKETS_VIEW)).toBe(false);
  });

  it('un usuario sin acceso al módulo tampoco, aunque conserve el permiso', () => {
    useAuthStore.getState().setSession(
      {
        id: 'user-1',
        email: 'admin@redsis.com',
        fullName: 'Administrador',
        isActive: true,
        roles: ['administrador'],
        modules: [],
        permissions: [PERMISSIONS.TICKETS_VIEW],
      },
      TOKENS,
    );

    expect(authorizationOfSession().can(PERMISSIONS.TICKETS_VIEW)).toBe(false);
  });
});
