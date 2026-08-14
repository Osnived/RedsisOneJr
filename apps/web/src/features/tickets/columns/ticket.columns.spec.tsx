import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  STANDARD_TICKET_COLUMNS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
} from '@redsis/contracts';
import { getTicketRowId, ticketColumns } from './ticket.columns';

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    number: 'INC-2026-000145',
    title: 'Equipo fuera de servicio',
    clientName: 'Banco Central',
    branchName: 'Sucursal Norte',
    city: 'Bogotá',
    zoneName: 'Zona Centro',
    status: TICKET_STATUSES.NEW,
    priority: TICKET_PRIORITIES.HIGH,
    technicianName: 'Ana Pérez',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-15T18:30:00.000Z',
    metadata: {},
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
  it('cubre las columnas pedidas por el negocio, en el orden del catálogo', () => {
    // El orden lo declara el catálogo compartido y no este archivo: es lo que
    // permite que un proyecto lo cambie sin desplegar.
    expect(ticketColumns.map((column) => column.id)).toEqual([
      'number',
      'status',
      'priority',
      'clientName',
      'branchName',
      'zoneName',
      'technicianName',
      'city',
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

describe('correspondencia con el catálogo de columnas estándar', () => {
  it('toda columna dibujada existe en el catálogo compartido', () => {
    // Los identificadores son la clave con la que se guardan la visibilidad, el
    // ancho y las vistas de cada usuario en su navegador. Si el catálogo y las
    // columnas del módulo divergen, una vista guardada apunta a algo que ya no
    // existe y el usuario la ve rota sin saber por qué.
    const catalogIds = new Set(STANDARD_TICKET_COLUMNS.map((column) => column.id));

    for (const column of ticketColumns) {
      expect(catalogIds).toContain(column.id);
    }
  });

  it('lo que el catálogo declara obligatorio no se puede ocultar', () => {
    for (const required of STANDARD_TICKET_COLUMNS.filter((column) => column.isRequired)) {
      const drawn = ticketColumns.find((column) => column.id === required.id);

      expect(drawn?.hideable).toBe(false);
    }
  });
});
