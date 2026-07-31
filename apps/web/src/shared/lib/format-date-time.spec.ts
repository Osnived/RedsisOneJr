/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { EMPTY_DATE, formatDateTime, toIsoString } from './format-date-time';

const INSTANT = '2026-07-31T14:05:00.000Z';

describe('formatDateTime', () => {
  it('muestra fecha y hora por defecto', () => {
    const text = formatDateTime(INSTANT);

    expect(text).toContain('31/7/2026');
    expect(text).toMatch(/\d{2}:\d{2}/);
  });

  it('muestra solo la fecha cuando se pide', () => {
    expect(formatDateTime(INSTANT, 'date')).toBe('31/7/2026');
  });

  it('muestra solo la hora cuando se pide', () => {
    expect(formatDateTime(INSTANT, 'time')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('acepta un Date además del texto ISO', () => {
    expect(formatDateTime(new Date(INSTANT), 'date')).toBe('31/7/2026');
  });

  describe('valores que no son una fecha', () => {
    it('marca como ausente el nulo', () => {
      expect(formatDateTime(null)).toBe(EMPTY_DATE);
    });

    it('marca como ausente el indefinido', () => {
      expect(formatDateTime(undefined)).toBe(EMPTY_DATE);
    });

    it('marca como ausente la cadena vacía', () => {
      expect(formatDateTime('')).toBe(EMPTY_DATE);
    });

    it('marca como ausente una fecha ilegible', () => {
      // Un dato ilegible no debe parecer un dato: nunca "Invalid Date".
      expect(formatDateTime('no es una fecha')).toBe(EMPTY_DATE);
    });
  });
});

describe('toIsoString', () => {
  it('devuelve el instante completo', () => {
    expect(toIsoString(INSTANT)).toBe(INSTANT);
  });

  it('normaliza un Date al mismo instante', () => {
    expect(toIsoString(new Date(INSTANT))).toBe(INSTANT);
  });

  it('no devuelve nada cuando no hay fecha', () => {
    expect(toIsoString(null)).toBeUndefined();
    expect(toIsoString('no es una fecha')).toBeUndefined();
  });
});
