import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type UserSummary,
} from '@redsis/contracts';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getTicketRowId, ticketColumns } from '@/features/tickets/columns/ticket.columns';
import { getUserRowId, userColumns } from '@/features/users/columns/user.columns';
import { DataTable } from './data-table';

/**
 * Comprobación del criterio de aceptación de MVP 4: dos dominios distintos se
 * muestran con el mismo DataTable, sin modificarlo, aportando solo su archivo de
 * columnas.
 */

const TICKET: Ticket = {
  id: 'ticket-1',
  number: 'INC-2026-000145',
  clientName: 'Banco Central',
  branchName: 'Sucursal Norte',
  city: 'Bogotá',
  status: TICKET_STATUSES.ON_ROUTE,
  priority: TICKET_PRIORITIES.CRITICAL,
  technicianName: 'Ana Pérez',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-15T18:30:00.000Z',
};

const USER: UserSummary = {
  id: 'user-1',
  email: 'admin@redsis.com',
  fullName: 'Administrador',
  isActive: true,
  roles: ['administrador'],
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: null,
};

describe('DataTable con el Column Registry', () => {
  it('muestra Tickets solo con su archivo de columnas', () => {
    render(
      <DataTable<Ticket>
        tableId={TABLE_IDS.TICKETS}
        columns={ticketColumns}
        data={[TICKET]}
        getRowId={getTicketRowId}
      />,
    );

    expect(screen.getByText('INC-2026-000145')).toBeInTheDocument();
    expect(screen.getByText('Banco Central')).toBeInTheDocument();
    expect(screen.getByText('En ruta')).toBeInTheDocument();
    expect(screen.getByText('Crítica')).toBeInTheDocument();
  });

  it('muestra Usuarios con el mismo componente sin modificarlo', () => {
    render(
      <DataTable<UserSummary>
        tableId={TABLE_IDS.USERS}
        columns={userColumns}
        data={[USER]}
        getRowId={getUserRowId}
      />,
    );

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('admin@redsis.com')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('respeta las columnas ocultas que declara cada módulo', () => {
    render(
      <DataTable<Ticket>
        tableId="tickets-ocultas"
        columns={ticketColumns}
        data={[TICKET]}
        getRowId={getTicketRowId}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /Creación/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: /Última actualización/ }),
    ).not.toBeInTheDocument();
  });

  it('cada módulo guarda sus preferencias bajo su propio identificador', () => {
    expect(TABLE_IDS.TICKETS).not.toBe(TABLE_IDS.USERS);
  });
});
