/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  type ColumnDefinition,
} from '@/shared/types/table';
import {
  buildColumnDefs,
  buildInitialColumnSizing,
  buildInitialColumnVisibility,
} from './column-adapter';
import { DEMO_COLUMNS, type DemoRow } from '@/test/table-fixtures';

describe('buildColumnDefs', () => {
  it('conserva el identificador y la cabecera de cada columna', () => {
    const defs = buildColumnDefs(DEMO_COLUMNS);

    expect(defs.map((def) => def.id)).toEqual(['name', 'amount', 'active', 'notes']);
    expect(defs[0]?.header).toBe('Nombre');
  });

  it('habilita orden, ocultado y redimensionado por defecto', () => {
    const [nameColumn] = buildColumnDefs(DEMO_COLUMNS);

    expect(nameColumn?.enableSorting).toBe(true);
    expect(nameColumn?.enableResizing).toBe(true);
  });

  it('ordena de forma ascendente en el primer clic, también en columnas numéricas', () => {
    const defs = buildColumnDefs(DEMO_COLUMNS);

    // TanStack usaría descendente para números; el framework lo uniformiza.
    for (const def of defs) {
      expect(def.sortDescFirst).toBe(false);
    }
  });

  it('respeta las capacidades desactivadas explícitamente', () => {
    const defs = buildColumnDefs(DEMO_COLUMNS);
    const notesColumn = defs.find((def) => def.id === 'notes');
    const nameColumn = defs.find((def) => def.id === 'name');

    expect(notesColumn?.enableSorting).toBe(false);
    expect(nameColumn?.enableHiding).toBe(false);
  });

  it('aplica el ancho declarado y el ancho por defecto', () => {
    const defs = buildColumnDefs(DEMO_COLUMNS);

    expect(defs.find((def) => def.id === 'amount')?.size).toBe(120);
    expect(defs.find((def) => def.id === 'name')?.size).toBe(DEFAULT_COLUMN_WIDTH);
    expect(defs.find((def) => def.id === 'name')?.minSize).toBe(MIN_COLUMN_WIDTH);
  });

  it('guarda la alineación en los metadatos', () => {
    const defs = buildColumnDefs(DEMO_COLUMNS);

    expect(defs.find((def) => def.id === 'amount')?.meta?.align).toBe('right');
    expect(defs.find((def) => def.id === 'active')?.meta?.align).toBe('center');
    expect(defs.find((def) => def.id === 'name')?.meta?.align).toBe('left');
  });

  it('expone el accesor declarado', () => {
    const columns: ColumnDefinition<DemoRow>[] = [
      { id: 'name', header: 'Nombre', accessor: (row) => row.name },
    ];
    const [def] = buildColumnDefs(columns);
    const accessorFn = def && 'accessorFn' in def ? def.accessorFn : undefined;

    expect(typeof accessorFn).toBe('function');
  });
});

describe('buildInitialColumnVisibility', () => {
  it('solo declara las columnas que arrancan ocultas', () => {
    expect(buildInitialColumnVisibility(DEMO_COLUMNS)).toEqual({ notes: false });
  });

  it('devuelve un mapa vacío si todas las columnas son visibles', () => {
    const columns: ColumnDefinition<DemoRow>[] = [
      { id: 'name', header: 'Nombre', accessor: (row) => row.name },
    ];

    expect(buildInitialColumnVisibility(columns)).toEqual({});
  });
});

describe('buildInitialColumnSizing', () => {
  it('solo incluye las columnas con ancho explícito', () => {
    expect(buildInitialColumnSizing(DEMO_COLUMNS)).toEqual({ amount: 120 });
  });
});
