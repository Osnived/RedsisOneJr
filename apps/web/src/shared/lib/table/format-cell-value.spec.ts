/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { EMPTY_CELL, formatCellValue } from './format-cell-value';

describe('formatCellValue', () => {
  it('marca los valores ausentes con un guion', () => {
    expect(formatCellValue(null)).toBe(EMPTY_CELL);
    expect(formatCellValue(undefined)).toBe(EMPTY_CELL);
    expect(formatCellValue('')).toBe(EMPTY_CELL);
  });

  it('traduce los booleanos a Sí y No', () => {
    expect(formatCellValue(true)).toBe('Sí');
    expect(formatCellValue(false)).toBe('No');
  });

  it('no confunde false con un valor ausente', () => {
    expect(formatCellValue(false)).not.toBe(EMPTY_CELL);
  });

  it('no confunde el cero con un valor ausente', () => {
    expect(formatCellValue(0)).toBe('0');
  });

  it('formatea las fechas válidas', () => {
    expect(formatCellValue(new Date(Date.UTC(2026, 0, 15)))).toContain('2026');
  });

  it('descarta una fecha inválida', () => {
    expect(formatCellValue(new Date('no-es-fecha'))).toBe(EMPTY_CELL);
  });

  it('descarta números no finitos', () => {
    expect(formatCellValue(Number.NaN)).toBe(EMPTY_CELL);
    expect(formatCellValue(Number.POSITIVE_INFINITY)).toBe(EMPTY_CELL);
  });

  it('une los arreglos con coma', () => {
    expect(formatCellValue(['a', 'b'])).toBe('a, b');
  });

  it('trata un arreglo vacío como valor ausente', () => {
    expect(formatCellValue([])).toBe(EMPTY_CELL);
  });

  it('nunca imprime [object Object]', () => {
    expect(formatCellValue({ nombre: 'x' })).toBe(EMPTY_CELL);
  });

  it('devuelve las cadenas tal cual', () => {
    expect(formatCellValue('Pendiente')).toBe('Pendiente');
  });
});
