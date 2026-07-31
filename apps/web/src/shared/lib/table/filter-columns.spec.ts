/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import type { SelectableColumn } from '@/shared/types/table';
import { filterColumnsByLabel } from './filter-columns';

const COLUMNS: SelectableColumn[] = [
  { id: 'number', label: 'Número', isVisible: true },
  { id: 'client', label: 'Cliente', isVisible: true },
  { id: 'branch', label: 'Sucursal', isVisible: false },
];

describe('filterColumnsByLabel', () => {
  it('devuelve todas las columnas sin término de búsqueda', () => {
    expect(filterColumnsByLabel(COLUMNS, '')).toEqual(COLUMNS);
  });

  it('trata los espacios en blanco como ausencia de búsqueda', () => {
    expect(filterColumnsByLabel(COLUMNS, '   ')).toEqual(COLUMNS);
  });

  it('encuentra por coincidencia parcial', () => {
    expect(filterColumnsByLabel(COLUMNS, 'cur')).toEqual([COLUMNS[2]]);
  });

  it('no distingue mayúsculas de minúsculas', () => {
    expect(filterColumnsByLabel(COLUMNS, 'CLIENTE')).toEqual([COLUMNS[1]]);
  });

  it('devuelve una lista vacía cuando nada coincide', () => {
    expect(filterColumnsByLabel(COLUMNS, 'técnico')).toEqual([]);
  });

  it('no altera la lista recibida', () => {
    filterColumnsByLabel(COLUMNS, 'cliente');

    expect(COLUMNS).toHaveLength(3);
  });
});
