import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from '@redsis/contracts';
import { getTicketRowId, ticketColumns } from './ticket.columns';

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    number: 'INC-2026-000145',
    clientName: 'Banco Central',
    branchName: 'Sucursal Norte',
    city: 'Bogotá',
    status: TICKET_STATUSES.NEW,
    priority: TICKET_PRIORITIES.HIGH,
    technicianName: 'Ana Pérez',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-15T18:30:00.000Z',
    ...overrides,
  };
}

/** Las celdas devuelven nodos: se montan para comprobar qué muestran. */
function renderCell(columnId: string, ticket: Ticket) {
  const column = ticketColumns.find((candidate) => candidate.id === columnId);

  if (!column?.cell) {
    throw new Error(`La columna ${columnId} no define render propio`);
  }

  return render(<>{column.cell(ticket)}</>);
}

describe('ticketColumns', () => {
  it('cubre las columnas pedidas por el negocio', () => {
    expect(ticketColumns.map((column) => column.id)).toEqual([
      'number',
      'clientName',
      'branchName',
      'city',
      'status',
      'priority',
      'technicianName',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('no permite ocultar el número de ticket', () => {
    expect(ticketColumns.find((column) => column.id === 'number')?.hideable).toBe(false);
  });

  it('arranca con la última actualización oculta', () => {
    expect(ticketColumns.find((column) => column.id === 'updatedAt')?.hiddenByDefault).toBe(true);
  });

  it('no ordena por roles ni deja columnas sin cabecera', () => {
    for (const column of ticketColumns) {
      expect(column.header.length).toBeGreaterThan(0);
    }
  });

  describe('accesores', () => {
    it('ordena las fechas cronológicamente, no como texto', () => {
      const column = ticketColumns.find((candidate) => candidate.id === 'createdAt');

      expect(column?.accessor(buildTicket())).toBeInstanceOf(Date);
    });

    it('expone el código de estado, no su etiqueta', () => {
      const column = ticketColumns.find((candidate) => candidate.id === 'status');

      expect(column?.accessor(buildTicket({ status: TICKET_STATUSES.ON_ROUTE }))).toBe('en-ruta');
    });

    it('deja el técnico nulo cuando el ticket no tiene asignación', () => {
      const column = ticketColumns.find((candidate) => candidate.id === 'technicianName');

      expect(column?.accessor(buildTicket({ technicianName: null }))).toBeNull();
    });
  });

  describe('render de estado', () => {
    it('muestra la etiqueta legible', () => {
      renderCell('status', buildTicket({ status: TICKET_STATUSES.ON_SITE }));

      expect(screen.getByText('En sitio')).toBeInTheDocument();
    });

    it('cubre todos los estados del catálogo sin fallar', () => {
      for (const status of Object.values(TICKET_STATUSES)) {
        const { unmount } = renderCell('status', buildTicket({ status }));
        unmount();
      }
    });
  });

  describe('render de prioridad', () => {
    it('muestra la etiqueta legible', () => {
      renderCell('priority', buildTicket({ priority: TICKET_PRIORITIES.CRITICAL }));

      expect(screen.getByText('Crítica')).toBeInTheDocument();
    });

    it('cubre todas las prioridades del catálogo sin fallar', () => {
      for (const priority of Object.values(TICKET_PRIORITIES)) {
        const { unmount } = renderCell('priority', buildTicket({ priority }));
        unmount();
      }
    });
  });
});

describe('getTicketRowId', () => {
  it('usa el identificador del ticket', () => {
    expect(getTicketRowId(buildTicket({ id: 'ticket-9' }))).toBe('ticket-9');
  });
});
