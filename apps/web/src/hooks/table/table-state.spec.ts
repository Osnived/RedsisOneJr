/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import type { TablePreferences } from '@/types/table';
import { differsFromDefaults, resolveUpdater, selectRows } from './table-state';

const DEFAULTS: TablePreferences = {
  columnVisibility: {},
  columnOrder: [],
  columnSizing: {},
  pageSize: 25,
  page: 1,
  sorting: [],
  search: '',
};

describe('resolveUpdater', () => {
  it('devuelve el valor cuando TanStack entrega un valor', () => {
    expect(resolveUpdater(5, 1)).toBe(5);
  });

  it('aplica la función cuando TanStack entrega un calculador', () => {
    expect(resolveUpdater((previous: number) => previous + 1, 1)).toBe(2);
  });

  it('funciona con objetos', () => {
    expect(
      resolveUpdater((previous: { page: number }) => ({ page: previous.page + 1 }), { page: 2 }),
    ).toEqual({
      page: 3,
    });
  });
});

describe('selectRows', () => {
  const data = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getRowId = (row: { id: string }): string => row.id;

  it('devuelve solo las filas marcadas', () => {
    expect(selectRows(data, getRowId, { a: true, c: true })).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('conserva el orden original de los datos', () => {
    expect(selectRows(data, getRowId, { c: true, a: true })).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('ignora las entradas marcadas como falsas', () => {
    expect(selectRows(data, getRowId, { a: false, b: true })).toEqual([{ id: 'b' }]);
  });

  it('devuelve un arreglo vacío sin selección', () => {
    expect(selectRows(data, getRowId, {})).toEqual([]);
  });

  it('ignora identificadores que ya no existen en los datos', () => {
    expect(selectRows(data, getRowId, { z: true })).toEqual([]);
  });
});

describe('differsFromDefaults', () => {
  it('no detecta cambios cuando todo está por defecto', () => {
    expect(differsFromDefaults({ ...DEFAULTS }, DEFAULTS)).toBe(false);
  });

  it('detecta un cambio de tamaño de página', () => {
    expect(differsFromDefaults({ ...DEFAULTS, pageSize: 50 }, DEFAULTS)).toBe(true);
  });

  it('detecta una búsqueda activa', () => {
    expect(differsFromDefaults({ ...DEFAULTS, search: 'algo' }, DEFAULTS)).toBe(true);
  });

  it('detecta un ordenamiento aplicado', () => {
    expect(
      differsFromDefaults({ ...DEFAULTS, sorting: [{ id: 'name', desc: false }] }, DEFAULTS),
    ).toBe(true);
  });

  it('detecta una columna oculta', () => {
    expect(differsFromDefaults({ ...DEFAULTS, columnVisibility: { a: false } }, DEFAULTS)).toBe(
      true,
    );
  });
});
