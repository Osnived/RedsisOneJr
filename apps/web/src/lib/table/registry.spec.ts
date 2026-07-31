/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import type { ColumnDefinition } from '@/types/table';
import { TABLE_IDS, defineColumns } from './registry';

interface Row {
  id: string;
  name: string;
}

const baseColumn: ColumnDefinition<Row> = {
  id: 'name',
  header: 'Nombre',
  accessor: (row) => row.name,
};

describe('TABLE_IDS', () => {
  it('no repite identificadores entre tablas', () => {
    const ids = Object.values(TABLE_IDS);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('usa identificadores en minúscula y sin espacios', () => {
    for (const id of Object.values(TABLE_IDS)) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

describe('defineColumns', () => {
  it('devuelve las columnas declaradas', () => {
    const columns = defineColumns<Row>([baseColumn]);

    expect(columns).toHaveLength(1);
    expect(columns[0]?.id).toBe('name');
  });

  it('conserva la identidad del arreglo para que el DataTable no lo reconstruya', () => {
    const declared = [baseColumn];

    expect(defineColumns(declared)).toBe(declared);
  });

  it('acepta un conjunto vacío', () => {
    expect(defineColumns<Row>([])).toEqual([]);
  });

  it('rechaza identificadores repetidos', () => {
    expect(() => defineColumns<Row>([baseColumn, { ...baseColumn, header: 'Otro' }])).toThrow(
      /identificadores repetidos/,
    );
  });

  it('informa qué identificador está repetido', () => {
    expect(() => defineColumns<Row>([baseColumn, baseColumn])).toThrow(/name/);
  });

  it('informa todos los identificadores repetidos, no solo el primero', () => {
    const columns: ColumnDefinition<Row>[] = [
      baseColumn,
      baseColumn,
      { id: 'id', header: 'Id', accessor: (row) => row.id },
      { id: 'id', header: 'Id', accessor: (row) => row.id },
    ];

    expect(() => defineColumns(columns)).toThrow(/name.*id|id.*name/);
  });

  it('no confunde identificadores distintos', () => {
    const columns: ColumnDefinition<Row>[] = [
      baseColumn,
      { id: 'id', header: 'Id', accessor: (row) => row.id },
    ];

    expect(() => defineColumns(columns)).not.toThrow();
  });
});
