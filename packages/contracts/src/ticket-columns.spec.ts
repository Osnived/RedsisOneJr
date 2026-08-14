import { describe, expect, it } from 'vitest';
import {
  CUSTOM_COLUMN_SLOTS,
  CUSTOM_COLUMN_SLOT_COUNT,
  STANDARD_TICKET_COLUMNS,
  TICKET_COLUMN_BINDINGS,
  TICKET_COLUMN_DATA_TYPES,
  TICKET_COLUMN_DATA_TYPE_LABELS,
  isCustomColumnSlot,
  ticketColumnLayoutSchema,
  type TicketColumnConfig,
} from './ticket-columns.js';

/** Una estructura válida a la que cada prueba le rompe una sola cosa. */
function layoutOf(columns: TicketColumnConfig[]): { columns: TicketColumnConfig[] } {
  return { columns };
}

const STANDARD = [...STANDARD_TICKET_COLUMNS];

function customColumn(overrides: Partial<TicketColumnConfig> = {}): TicketColumnConfig {
  const [slot] = CUSTOM_COLUMN_SLOTS;

  return {
    id: slot ?? 'ColumnaAgrega1',
    label: 'Fecha compromiso',
    binding: TICKET_COLUMN_BINDINGS.METADATA,
    key: slot ?? 'ColumnaAgrega1',
    type: TICKET_COLUMN_DATA_TYPES.DATE_TIME,
    isVisible: true,
    order: 11,
    isRequired: false,
    isGroupable: false,
    ...overrides,
  };
}

describe('columnas estándar', () => {
  it('son las diez que puede mostrar cualquier proyecto', () => {
    expect(STANDARD_TICKET_COLUMNS).toHaveLength(10);
  });

  it('ninguna comparte identificador con otra', () => {
    const ids = STANDARD_TICKET_COLUMNS.map((column) => column.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todas se alimentan de un campo del contrato, no de metadata', () => {
    for (const column of STANDARD_TICKET_COLUMNS) {
      expect(column.binding).toBe(TICKET_COLUMN_BINDINGS.STANDARD);
    }
  });

  it('el número del ticket es la única obligatoria', () => {
    const required = STANDARD_TICKET_COLUMNS.filter((column) => column.isRequired);

    expect(required.map((column) => column.id)).toEqual(['number']);
  });

  it('todo tipo de dato tiene etiqueta', () => {
    for (const type of Object.values(TICKET_COLUMN_DATA_TYPES)) {
      expect(TICKET_COLUMN_DATA_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });
});

describe('espacios para columnas adicionales', () => {
  it('hay veinte disponibles', () => {
    expect(CUSTOM_COLUMN_SLOTS).toHaveLength(CUSTOM_COLUMN_SLOT_COUNT);
  });

  it('se numeran desde uno', () => {
    expect(CUSTOM_COLUMN_SLOTS[0]).toBe('ColumnaAgrega1');
    expect(CUSTOM_COLUMN_SLOTS.at(-1)).toBe('ColumnaAgrega20');
  });

  it('reconoce un espacio adicional y descarta lo que no lo es', () => {
    expect(isCustomColumnSlot('ColumnaAgrega7')).toBe(true);
    expect(isCustomColumnSlot('ColumnaAgrega21')).toBe(false);
    expect(isCustomColumnSlot('clientName')).toBe(false);
  });
});

describe('estructura de columnas de un proyecto', () => {
  it('acepta las estándar más una adicional con nombre propio', () => {
    const result = ticketColumnLayoutSchema.safeParse(layoutOf([...STANDARD, customColumn()]));

    expect(result.success).toBe(true);
  });

  it('un proyecto puede usar menos columnas de las que existen', () => {
    const reduced = STANDARD.filter((column) => ['number', 'status'].includes(column.id));

    expect(ticketColumnLayoutSchema.safeParse(layoutOf(reduced)).success).toBe(true);
  });

  it('rechaza dos columnas con el mismo identificador', () => {
    // Escribirían en la misma clave de preferencias y corromperían en silencio la
    // visibilidad y el ancho guardados del usuario.
    const duplicated = [...STANDARD, customColumn({ id: 'clientName' })];

    expect(ticketColumnLayoutSchema.safeParse(layoutOf(duplicated)).success).toBe(false);
  });

  it('no permite retirar el número del ticket', () => {
    const withoutNumber = STANDARD.filter((column) => column.id !== 'number');

    expect(ticketColumnLayoutSchema.safeParse(layoutOf(withoutNumber)).success).toBe(false);
  });

  it('no admite más columnas adicionales de las que caben', () => {
    const tooMany = CUSTOM_COLUMN_SLOTS.map((slot, index) =>
      customColumn({ id: slot, key: slot, order: 11 + index }),
    ).concat(customColumn({ id: 'extra', key: 'extra', order: 99 }));

    expect(ticketColumnLayoutSchema.safeParse(layoutOf([...STANDARD, ...tooMany])).success).toBe(
      false,
    );
  });

  it('los veinte espacios sí caben', () => {
    const allSlots = CUSTOM_COLUMN_SLOTS.map((slot, index) =>
      customColumn({ id: slot, key: slot, order: 11 + index }),
    );

    expect(ticketColumnLayoutSchema.safeParse(layoutOf([...STANDARD, ...allSlots])).success).toBe(
      true,
    );
  });

  it('una tabla sin columnas no es una tabla', () => {
    expect(ticketColumnLayoutSchema.safeParse(layoutOf([])).success).toBe(false);
  });

  it('exige un nombre visible para la columna', () => {
    const unnamed = [...STANDARD, customColumn({ label: '  ' })];

    expect(ticketColumnLayoutSchema.safeParse(layoutOf(unnamed)).success).toBe(false);
  });
});
