import { describe, expect, it } from 'vitest';
import { buildPaginatedResult, paginationSchema } from './common.js';

describe('paginationSchema', () => {
  it('aplica los valores por defecto', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 25 });
  });

  it('convierte los parámetros de texto a número', () => {
    expect(paginationSchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('rechaza una página menor que uno', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('limita el tamaño de página para no permitir descargas masivas', () => {
    expect(paginationSchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});

describe('buildPaginatedResult', () => {
  it('calcula el total de páginas redondeando hacia arriba', () => {
    const result = buildPaginatedResult(['a'], 21, { page: 1, pageSize: 10 });

    expect(result.totalPages).toBe(3);
  });

  it('devuelve cero páginas cuando no hay registros', () => {
    const result = buildPaginatedResult([], 0, { page: 1, pageSize: 10 });

    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('conserva la página y el tamaño solicitados', () => {
    const result = buildPaginatedResult(['a', 'b'], 2, { page: 2, pageSize: 5 });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
  });
});
