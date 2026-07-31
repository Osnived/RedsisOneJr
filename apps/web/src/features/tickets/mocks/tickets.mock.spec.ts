/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@redsis/contracts';
import { ticketColumns } from '../columns/ticket.columns';
import { MOCK_TICKETS } from './tickets.mock';

describe('MOCK_TICKETS', () => {
  it('tiene alrededor de 25 registros', () => {
    expect(MOCK_TICKETS).toHaveLength(25);
  });

  it('no repite identificadores', () => {
    const ids = MOCK_TICKETS.map((ticket) => ticket.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no repite números de ticket', () => {
    const numbers = MOCK_TICKETS.map((ticket) => ticket.number);

    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('usa el formato de número acordado', () => {
    for (const ticket of MOCK_TICKETS) {
      expect(ticket.number).toMatch(/^INC-\d{4}-\d{6}$/);
    }
  });

  it('usa solo estados del catálogo', () => {
    const valid = new Set<string>(Object.values(TICKET_STATUSES));

    for (const ticket of MOCK_TICKETS) {
      expect(valid.has(ticket.status)).toBe(true);
    }
  });

  it('usa solo prioridades del catálogo', () => {
    const valid = new Set<string>(Object.values(TICKET_PRIORITIES));

    for (const ticket of MOCK_TICKETS) {
      expect(valid.has(ticket.priority)).toBe(true);
    }
  });

  it('tiene fechas válidas y coherentes', () => {
    for (const ticket of MOCK_TICKETS) {
      const created = new Date(ticket.createdAt);
      const updated = new Date(ticket.updatedAt);

      expect(Number.isNaN(created.getTime())).toBe(false);
      expect(Number.isNaN(updated.getTime())).toBe(false);
      // Nada puede actualizarse antes de existir.
      expect(updated.getTime()).toBeGreaterThanOrEqual(created.getTime());
    }
  });

  it('cubre variedad suficiente para ejercitar la tabla', () => {
    // Con un solo estado o una sola ciudad no se podría comprobar el orden ni la
    // búsqueda de forma significativa.
    expect(new Set(MOCK_TICKETS.map((ticket) => ticket.status)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(MOCK_TICKETS.map((ticket) => ticket.city)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(MOCK_TICKETS.map((ticket) => ticket.clientName)).size).toBeGreaterThanOrEqual(5);
  });

  it('incluye tickets sin técnico asignado', () => {
    expect(MOCK_TICKETS.some((ticket) => ticket.technicianName === null)).toBe(true);
  });

  it('supera una página para poder probar la paginación', () => {
    expect(MOCK_TICKETS.length).toBeGreaterThan(10);
  });

  it('todas las columnas declaradas leen algún valor de los mocks', () => {
    // Una columna cuyo accesor falla con datos reales rompería la pantalla.
    for (const column of ticketColumns) {
      for (const ticket of MOCK_TICKETS) {
        expect(() => column.accessor(ticket)).not.toThrow();
      }
    }
  });
});
