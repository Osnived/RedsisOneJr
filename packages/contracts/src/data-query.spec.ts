import { describe, expect, it } from 'vitest';
import {
  FILTER_OPERATORS,
  MAX_PAGE_SIZE,
  dataQuerySchema,
  operatorNeedsValue,
} from './data-query.js';

describe('operadores de filtro', () => {
  it('declara los siete operadores del constructor', () => {
    expect(FILTER_OPERATORS).toHaveLength(7);
  });

  it('preguntar por la ausencia de dato no admite valor', () => {
    expect(operatorNeedsValue('vacio')).toBe(false);
    expect(operatorNeedsValue('noVacio')).toBe(false);
  });

  it('el resto de operadores compara contra un valor', () => {
    const comparing = FILTER_OPERATORS.filter((operator) => operatorNeedsValue(operator));

    expect(comparing).toEqual(['es', 'noEs', 'contiene', 'empiezaPor', 'terminaPor']);
  });
});

describe('consulta de datos', () => {
  it('una consulta vacía equivale a la primera página sin filtros', () => {
    const query = dataQuerySchema.parse({});

    expect(query).toEqual({ page: 1, pageSize: 25, search: '', sorting: [], filters: [] });
  });

  it('no se puede pedir más de una página de tamaño máximo', () => {
    // Sin este tope, una petición podría arrastrar el origen entero a memoria.
    expect(dataQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE }).success).toBe(true);
    expect(dataQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });

  it('rechaza un operador que ningún proveedor sabría traducir', () => {
    const result = dataQuerySchema.safeParse({
      filters: [{ id: 'f1', columnId: 'status', operator: 'mayorQue', value: '3' }],
    });

    expect(result.success).toBe(false);
  });

  it('la primera página es la uno, no la cero', () => {
    expect(dataQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });
});
