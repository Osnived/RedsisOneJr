/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import type { AdvancedFilter, ColumnDefinition, FilterOperator } from '@/shared/types/table';
import { applyAdvancedFilters, toFilterText } from './apply-filters';

interface Row {
  name: string;
  city: string | null;
  amount: number;
  active: boolean;
  createdAt: Date;
}

const COLUMNS: ColumnDefinition<Row>[] = [
  { id: 'name', header: 'Nombre', accessor: (row) => row.name },
  { id: 'city', header: 'Ciudad', accessor: (row) => row.city },
  { id: 'amount', header: 'Monto', accessor: (row) => row.amount },
  { id: 'active', header: 'Activo', accessor: (row) => row.active },
  { id: 'createdAt', header: 'Creación', accessor: (row) => row.createdAt },
];

const ROWS: Row[] = [
  {
    name: 'Ana Torres',
    city: 'Bogotá',
    amount: 100,
    active: true,
    createdAt: new Date(Date.UTC(2026, 0, 15)),
  },
  { name: 'Beto Ruiz', city: 'Medellín', amount: 200, active: false, createdAt: new Date(0) },
  { name: 'Carla Díaz', city: null, amount: 300, active: true, createdAt: new Date(0) },
  { name: 'ana maría', city: '', amount: 400, active: false, createdAt: new Date(0) },
];

function filter(columnId: string, operator: FilterOperator, value = '', id = 'f1'): AdvancedFilter {
  return { id, columnId, operator, value };
}

function names(filters: AdvancedFilter[]): string[] {
  return applyAdvancedFilters(ROWS, filters, COLUMNS).map((row) => row.name);
}

describe('applyAdvancedFilters', () => {
  it('devuelve todo sin condiciones', () => {
    expect(applyAdvancedFilters(ROWS, [], COLUMNS)).toHaveLength(4);
  });

  describe('los siete operadores', () => {
    it('es exige el valor exacto', () => {
      expect(names([filter('city', 'es', 'Bogotá')])).toEqual(['Ana Torres']);
    });

    it('no es descarta el valor exacto', () => {
      expect(names([filter('city', 'noEs', 'Bogotá')])).toEqual([
        'Beto Ruiz',
        'Carla Díaz',
        'ana maría',
      ]);
    });

    it('contiene busca en cualquier posición', () => {
      expect(names([filter('name', 'contiene', 'ana')])).toEqual(['Ana Torres', 'ana maría']);
    });

    it('empieza por ancla al principio', () => {
      expect(names([filter('name', 'empiezaPor', 'ana')])).toEqual(['Ana Torres', 'ana maría']);
      expect(names([filter('name', 'empiezaPor', 'torres')])).toEqual([]);
    });

    it('termina por ancla al final', () => {
      expect(names([filter('name', 'terminaPor', 'torres')])).toEqual(['Ana Torres']);
    });

    it('vacío encuentra los nulos y las cadenas vacías', () => {
      expect(names([filter('city', 'vacio')])).toEqual(['Carla Díaz', 'ana maría']);
    });

    it('no vacío encuentra los que tienen dato', () => {
      expect(names([filter('city', 'noVacio')])).toEqual(['Ana Torres', 'Beto Ruiz']);
    });
  });

  it('no distingue mayúsculas de minúsculas', () => {
    expect(names([filter('city', 'es', 'BOGOTÁ')])).toEqual(['Ana Torres']);
  });

  it('ignora los espacios alrededor del valor', () => {
    expect(names([filter('city', 'es', '  Bogotá  ')])).toEqual(['Ana Torres']);
  });

  it('combina varias condiciones con Y', () => {
    const result = names([
      filter('name', 'contiene', 'ana', 'f1'),
      filter('city', 'vacio', '', 'f2'),
    ]);

    expect(result).toEqual(['ana maría']);
  });

  describe('condiciones que todavía no filtran', () => {
    it('ignora una condición sin valor cuando el operador lo necesita', () => {
      // Sin esto, elegir "contiene" vaciaría la tabla antes de teclear nada.
      expect(applyAdvancedFilters(ROWS, [filter('name', 'contiene', '')], COLUMNS)).toHaveLength(4);
    });

    it('ignora una condición con solo espacios', () => {
      expect(applyAdvancedFilters(ROWS, [filter('name', 'contiene', '   ')], COLUMNS)).toHaveLength(
        4,
      );
    });

    it('aplica vacío aunque no lleve valor', () => {
      expect(names([filter('city', 'vacio')])).toHaveLength(2);
    });
  });

  it('ignora una condición sobre una columna que ya no existe', () => {
    // Puede venir de una vista guardada antes de que la columna desapareciera.
    expect(applyAdvancedFilters(ROWS, [filter('inexistente', 'es', 'x')], COLUMNS)).toHaveLength(4);
  });

  it('no altera la lista recibida', () => {
    applyAdvancedFilters(ROWS, [filter('city', 'es', 'Bogotá')], COLUMNS);

    expect(ROWS).toHaveLength(4);
  });

  describe('tipos de dato', () => {
    it('compara números como están en el dato', () => {
      expect(names([filter('amount', 'es', '300')])).toEqual(['Carla Díaz']);
    });

    it('compara booleanos como los ve el usuario', () => {
      expect(names([filter('active', 'es', 'sí')])).toEqual(['Ana Torres', 'Carla Díaz']);
    });

    it('compara fechas por su representación local', () => {
      expect(names([filter('createdAt', 'contiene', '2026')])).toEqual(['Ana Torres']);
    });
  });
});

describe('toFilterText', () => {
  it('convierte la ausencia de dato en cadena vacía', () => {
    // Es lo que permite que "vacío" funcione.
    expect(toFilterText(null)).toBe('');
    expect(toFilterText(undefined)).toBe('');
  });

  it('descarta una fecha no válida', () => {
    expect(toFilterText(new Date('no es fecha'))).toBe('');
  });

  it('une los valores de una lista', () => {
    expect(toFilterText(['Uno', 'Dos'])).toBe('uno, dos');
  });

  it('no intenta representar un objeto sin formato propio', () => {
    expect(toFilterText({ a: 1 })).toBe('');
  });
});
