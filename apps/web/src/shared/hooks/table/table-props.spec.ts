/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import type { DataTableProps } from '@/shared/types/table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';
import { splitTableProps } from './table-props';

function buildProps(overrides: Partial<DataTableProps<DemoRow>> = {}): DataTableProps<DemoRow> {
  return {
    tableId: 'demo',
    columns: DEMO_COLUMNS,
    data: buildDemoRows(3),
    getRowId: getDemoRowId,
    ...overrides,
  };
}

describe('splitTableProps', () => {
  it('entrega al motor lo que necesita para existir', () => {
    const { engine } = splitTableProps(buildProps());

    expect(engine.tableId).toBe('demo');
    expect(engine.columns).toBe(DEMO_COLUMNS);
    expect(engine.getRowId).toBe(getDemoRowId);
  });

  it('omite las opcionales ausentes en lugar de enviarlas como undefined', () => {
    const { engine, view } = splitTableProps(buildProps());

    expect('rowActions' in engine).toBe(false);
    expect('mode' in engine).toBe(false);
    expect('loading' in view).toBe(false);
    expect('searchPlaceholder' in view).toBe(false);
  });

  it('conserva las opcionales que sí llegan', () => {
    const onQueryChange = vi.fn();

    const { engine } = splitTableProps(
      buildProps({ mode: 'server', totalRows: 120, onQueryChange }),
    );

    expect(engine.mode).toBe('server');
    expect(engine.totalRows).toBe(120);
    expect(engine.onQueryChange).toBe(onQueryChange);
  });

  it('no mezcla la presentación con el motor', () => {
    const { engine, view } = splitTableProps(
      buildProps({ loading: true, emptyMessage: 'Sin registros', enableRowSelection: true }),
    );

    expect(view.loading).toBe(true);
    expect(view.emptyMessage).toBe('Sin registros');
    expect('emptyMessage' in engine).toBe(false);
    expect('enableRowSelection' in view).toBe(false);
    expect(engine.enableRowSelection).toBe(true);
  });

  it('conserva un error aunque sea null', () => {
    const { view } = splitTableProps(buildProps({ error: null }));

    expect(view.error).toBeNull();
  });
});
