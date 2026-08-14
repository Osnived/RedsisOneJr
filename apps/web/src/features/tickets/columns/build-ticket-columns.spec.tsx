import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CUSTOM_COLUMN_SLOTS,
  STANDARD_TICKET_COLUMNS,
  TICKET_COLUMN_BINDINGS,
  TICKET_COLUMN_DATA_TYPES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketColumnConfig,
} from '@redsis/contracts';
import { buildTicketColumns } from './build-ticket-columns';

/**
 * El Column Adapter traduce la configuración de un proyecto a columnas del
 * framework. Lo que se comprueba es que un proyecto pueda declarar su estructura
 * —columnas propias, nombres propios, tipos propios— sin que nada del framework
 * tenga que enterarse.
 */

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    number: 'INC-2026-000145',
    title: 'Equipo fuera de servicio',
    clientName: 'Banco Central',
    branchName: 'Sucursal Norte',
    city: 'Bogotá',
    zoneName: 'Zona Centro',
    status: TICKET_STATUSES.ON_ROUTE,
    priority: TICKET_PRIORITIES.CRITICAL,
    technicianName: 'Ana Pérez',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-15T18:30:00.000Z',
    metadata: {},
    ...overrides,
  };
}

function customColumn(overrides: Partial<TicketColumnConfig> = {}): TicketColumnConfig {
  const [slot] = CUSTOM_COLUMN_SLOTS;
  const id = slot ?? 'ColumnaAgrega1';

  return {
    id,
    key: id,
    label: 'Fecha compromiso',
    binding: TICKET_COLUMN_BINDINGS.METADATA,
    type: TICKET_COLUMN_DATA_TYPES.TEXT,
    isVisible: true,
    order: 11,
    isRequired: false,
    isGroupable: false,
    ...overrides,
  };
}

function columnOf(configs: TicketColumnConfig[], id: string) {
  const column = buildTicketColumns(configs).find((candidate) => candidate.id === id);

  if (column === undefined) {
    throw new Error(`La columna ${id} debería existir`);
  }

  return column;
}

describe('columnas configurables', () => {
  it('un proyecto puede declarar una columna adicional con su propio nombre', () => {
    // "ColumnaAgrega1" es el identificador; lo que el usuario lee es su nombre.
    const column = columnOf([customColumn({ label: 'Fecha compromiso' })], 'ColumnaAgrega1');

    expect(column.header).toBe('Fecha compromiso');
  });

  it('lee su valor de los datos adicionales del proveedor', () => {
    const column = columnOf([customColumn()], 'ColumnaAgrega1');
    const ticket = buildTicket({ metadata: { ColumnaAgrega1: 'Equipo 42' } });

    expect(column.accessor(ticket)).toBe('Equipo 42');
  });

  it('una columna configurada que el origen no entrega muestra vacío, no rompe', () => {
    const column = columnOf([customColumn()], 'ColumnaAgrega1');

    expect(column.accessor(buildTicket({ metadata: {} }))).toBeNull();
  });

  it('caben los veinte espacios disponibles', () => {
    const configs = CUSTOM_COLUMN_SLOTS.map((slot, index) =>
      customColumn({ id: slot, key: slot, label: `Columna ${index + 1}`, order: index + 1 }),
    );

    expect(buildTicketColumns(configs)).toHaveLength(20);
  });

  it('dos columnas con el mismo identificador fallan al construirse', () => {
    // Escribirían en la misma clave de preferencias y corromperían en silencio la
    // visibilidad y el ancho guardados del usuario.
    const repeated = [customColumn(), customColumn({ label: 'Otra cosa' })];

    expect(() => buildTicketColumns(repeated)).toThrow(/repetidos/);
  });
});

describe('orden y visibilidad', () => {
  it('respeta el orden que declara el proyecto', () => {
    const configs = [
      customColumn({ id: 'ColumnaAgrega2', key: 'ColumnaAgrega2', order: 2 }),
      customColumn({ id: 'ColumnaAgrega1', key: 'ColumnaAgrega1', order: 1 }),
    ];

    expect(buildTicketColumns(configs).map((column) => column.id)).toEqual([
      'ColumnaAgrega1',
      'ColumnaAgrega2',
    ]);
  });

  it('una columna no visible arranca oculta y se puede activar', () => {
    const column = columnOf([customColumn({ isVisible: false })], 'ColumnaAgrega1');

    expect(column.hiddenByDefault).toBe(true);
    expect(column.hideable).toBe(true);
  });

  it('una columna obligatoria no se puede ocultar', () => {
    const column = columnOf([customColumn({ isRequired: true })], 'ColumnaAgrega1');

    expect(column.hideable).toBe(false);
  });

  it('agrupar es algo que el proyecto declara', () => {
    expect(columnOf([customColumn({ isGroupable: true })], 'ColumnaAgrega1').groupable).toBe(true);
    expect(columnOf([customColumn({ isGroupable: false })], 'ColumnaAgrega1').groupable).toBe(
      false,
    );
  });
});

describe('tipos de dato', () => {
  it('una fecha se lee como fecha, para que el orden sea cronológico', () => {
    // Ordenar texto ISO funciona por casualidad, y la casualidad se rompe en cuanto
    // un proveedor entrega otro formato.
    const column = columnOf(
      [customColumn({ type: TICKET_COLUMN_DATA_TYPES.DATE_TIME })],
      'ColumnaAgrega1',
    );
    const value = column.accessor(
      buildTicket({ metadata: { ColumnaAgrega1: '2026-07-24T00:17:13.000Z' } }),
    );

    expect(value).toBeInstanceOf(Date);
  });

  it('una fecha ausente no se convierte en una fecha inválida', () => {
    const column = columnOf(
      [customColumn({ type: TICKET_COLUMN_DATA_TYPES.DATE_TIME })],
      'ColumnaAgrega1',
    );

    expect(column.accessor(buildTicket({ metadata: { ColumnaAgrega1: null } }))).toBeNull();
  });

  it('un número entregado como texto se lee como número', () => {
    // RedsisOne entrega todos sus valores como texto, incluidos los números.
    const column = columnOf(
      [customColumn({ type: TICKET_COLUMN_DATA_TYPES.NUMBER })],
      'ColumnaAgrega1',
    );

    expect(column.accessor(buildTicket({ metadata: { ColumnaAgrega1: '154' } }))).toBe(154);
  });

  it('los números se alinean a la derecha', () => {
    expect(
      columnOf([customColumn({ type: TICKET_COLUMN_DATA_TYPES.NUMBER })], 'ColumnaAgrega1').align,
    ).toBe('right');
  });

  it('cada tipo recibe un ancho inicial', () => {
    for (const type of Object.values(TICKET_COLUMN_DATA_TYPES)) {
      expect(columnOf([customColumn({ type })], 'ColumnaAgrega1').width).toBeGreaterThan(0);
    }
  });
});

describe('render propio del dominio', () => {
  it('el estado se pinta con su distintivo de color', () => {
    const column = columnOf([...STANDARD_TICKET_COLUMNS], 'status');

    render(<>{column.cell?.(buildTicket())}</>);

    expect(screen.getByText('En ruta')).toBeInTheDocument();
  });

  it('agrupar por estado muestra la etiqueta y no el código', () => {
    const column = columnOf([...STANDARD_TICKET_COLUMNS], 'status');

    expect(column.groupLabel?.('en-ruta')).toBe('En ruta');
  });

  it('una columna adicional de tipo estado se muestra como texto', () => {
    // El tipo dice "valor de un catálogo cerrado", pero solo el estado y la
    // prioridad del ticket tienen colores declarados.
    const column = columnOf(
      [customColumn({ type: TICKET_COLUMN_DATA_TYPES.STATUS })],
      'ColumnaAgrega1',
    );

    expect(column.cell).toBeUndefined();
  });

  it('el accesor del estado devuelve el código, no la etiqueta', () => {
    // El orden, la búsqueda y los filtros operan sobre el dato real.
    const column = columnOf([...STANDARD_TICKET_COLUMNS], 'status');

    expect(column.accessor(buildTicket())).toBe('en-ruta');
  });
});
