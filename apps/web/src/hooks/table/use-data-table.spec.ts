import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { TableQuery } from '@/types/table';
import { useDataTable } from './use-data-table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';

function renderTable(overrides: Partial<Parameters<typeof useDataTable<DemoRow>>[0]> = {}) {
  const data = overrides.data ?? buildDemoRows(60);

  return renderHook(() =>
    useDataTable<DemoRow>({
      tableId: overrides.tableId ?? 'demo',
      columns: DEMO_COLUMNS,
      data,
      getRowId: getDemoRowId,
      ...overrides,
    }),
  );
}

describe('useDataTable', () => {
  describe('modo cliente', () => {
    it('pagina los datos recibidos', () => {
      const { result } = renderTable();

      expect(result.current.table.getRowModel().rows).toHaveLength(25);
      expect(result.current.table.getRowCount()).toBe(60);
      expect(result.current.table.getPageCount()).toBe(3);
    });

    it('avanza y retrocede de página', () => {
      const { result } = renderTable();

      act(() => {
        result.current.table.nextPage();
      });

      expect(result.current.table.getState().pagination.pageIndex).toBe(1);
      expect(result.current.table.getRowModel().rows[0]?.id).toBe('row-26');
    });

    it('ordena por la columna indicada', () => {
      const { result } = renderTable();

      act(() => {
        result.current.table.getColumn('amount')?.toggleSorting(true);
      });

      const firstRow = result.current.table.getRowModel().rows[0];
      expect(firstRow?.original.amount).toBe(600);
    });

    it('vuelve a la primera página al cambiar el orden', () => {
      const { result } = renderTable();

      act(() => {
        result.current.table.nextPage();
      });
      act(() => {
        result.current.table.getColumn('amount')?.toggleSorting(true);
      });

      expect(result.current.table.getState().pagination.pageIndex).toBe(0);
    });

    it('filtra con la búsqueda global', () => {
      const { result } = renderTable();

      act(() => {
        result.current.setSearch('Registro 007');
      });

      expect(result.current.table.getRowModel().rows).toHaveLength(1);
      expect(result.current.table.getRowModel().rows[0]?.original.name).toBe('Registro 007');
    });

    it('vuelve a la primera página al buscar', () => {
      const { result } = renderTable();

      act(() => {
        result.current.table.nextPage();
      });
      act(() => {
        result.current.setSearch('Registro');
      });

      expect(result.current.table.getState().pagination.pageIndex).toBe(0);
    });

    it('no deja filas cuando la búsqueda no coincide con nada', () => {
      const { result } = renderTable();

      act(() => {
        result.current.setSearch('inexistente-zzz');
      });

      expect(result.current.table.getRowModel().rows).toHaveLength(0);
    });
  });

  describe('visibilidad de columnas', () => {
    it('respeta las columnas ocultas por defecto', () => {
      const { result } = renderTable();
      const visibleIds = result.current.table.getVisibleLeafColumns().map((column) => column.id);

      expect(visibleIds).toEqual(['name', 'amount', 'active']);
    });

    it('permite mostrar una columna oculta', () => {
      const { result } = renderTable();

      act(() => {
        result.current.table.getColumn('notes')?.toggleVisibility(true);
      });

      expect(result.current.table.getColumn('notes')?.getIsVisible()).toBe(true);
    });

    it('no permite ocultar una columna declarada como imprescindible', () => {
      const { result } = renderTable();

      expect(result.current.table.getColumn('name')?.getCanHide()).toBe(false);
    });
  });

  describe('preferencias', () => {
    it('empieza sin preferencias personalizadas', () => {
      const { result } = renderTable({ tableId: 'sin-cambios' });

      expect(result.current.hasCustomPreferences).toBe(false);
    });

    it('detecta que el usuario cambió el orden', () => {
      const { result } = renderTable({ tableId: 'con-orden' });

      act(() => {
        result.current.table.getColumn('amount')?.toggleSorting(false);
      });

      expect(result.current.hasCustomPreferences).toBe(true);
    });

    it('conserva el tamaño de página entre montajes', () => {
      const first = renderTable({ tableId: 'persistente' });

      act(() => {
        first.result.current.table.setPageSize(50);
      });
      first.unmount();

      const second = renderTable({ tableId: 'persistente' });

      expect(second.result.current.table.getState().pagination.pageSize).toBe(50);
    });

    it('conserva la búsqueda tras recargar', () => {
      const first = renderTable({ tableId: 'persiste-busqueda' });

      act(() => {
        first.result.current.setSearch('Registro 007');
      });
      first.unmount();

      const second = renderTable({ tableId: 'persiste-busqueda' });

      expect(second.result.current.search).toBe('Registro 007');
      expect(second.result.current.table.getRowModel().rows).toHaveLength(1);
    });

    it('conserva la página actual tras recargar', () => {
      const first = renderTable({ tableId: 'persiste-pagina' });

      act(() => {
        first.result.current.table.setPageIndex(2);
      });
      first.unmount();

      const second = renderTable({ tableId: 'persiste-pagina' });

      expect(second.result.current.table.getState().pagination.pageIndex).toBe(2);
      expect(second.result.current.table.getRowModel().rows[0]?.id).toBe('row-51');
    });

    it('conserva el ordenamiento tras recargar', () => {
      const first = renderTable({ tableId: 'persiste-orden' });

      act(() => {
        first.result.current.table.getColumn('amount')?.toggleSorting(true);
      });
      first.unmount();

      const second = renderTable({ tableId: 'persiste-orden' });

      expect(second.result.current.table.getState().sorting).toEqual([
        { id: 'amount', desc: true },
      ]);
    });

    it('conserva las columnas visibles tras recargar', () => {
      const first = renderTable({ tableId: 'persiste-columnas' });

      act(() => {
        first.result.current.table.getColumn('notes')?.toggleVisibility(true);
      });
      first.unmount();

      const second = renderTable({ tableId: 'persiste-columnas' });

      expect(second.result.current.table.getColumn('notes')?.getIsVisible()).toBe(true);
    });

    it('conserva el orden de columnas tras recargar', () => {
      const first = renderTable({ tableId: 'persiste-orden-columnas' });

      act(() => {
        first.result.current.table.setColumnOrder(['amount', 'name', 'active', 'notes']);
      });
      first.unmount();

      const second = renderTable({ tableId: 'persiste-orden-columnas' });

      expect(second.result.current.table.getState().columnOrder).toEqual([
        'amount',
        'name',
        'active',
        'notes',
      ]);
    });

    it('aplica el orden de columnas restaurado a las columnas visibles', () => {
      const first = renderTable({ tableId: 'aplica-orden' });

      act(() => {
        first.result.current.table.setColumnOrder(['amount', 'active', 'name']);
      });
      first.unmount();

      const second = renderTable({ tableId: 'aplica-orden' });

      expect(
        second.result.current.table.getVisibleLeafColumns().map((column) => column.id),
      ).toEqual(['amount', 'active', 'name']);
    });

    it('conserva el ancho de columna tras recargar', () => {
      const first = renderTable({ tableId: 'persiste-ancho' });

      act(() => {
        first.result.current.table.setColumnSizing({ name: 300 });
      });
      first.unmount();

      const second = renderTable({ tableId: 'persiste-ancho' });

      expect(second.result.current.table.getColumn('name')?.getSize()).toBe(300);
    });

    it('restablece los ajustes y vuelve a la primera página', () => {
      const { result } = renderTable({ tableId: 'restablecer' });

      act(() => {
        result.current.table.setPageSize(50);
      });
      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.table.getState().pagination.pageSize).toBe(25);
      expect(result.current.table.getState().pagination.pageIndex).toBe(0);
      expect(result.current.hasCustomPreferences).toBe(false);
    });
  });

  describe('modo servidor', () => {
    it('no vuelve a paginar los datos que entrega el backend', () => {
      const { result } = renderTable({
        tableId: 'servidor',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
      });

      // El backend ya envió solo la página pedida: se muestran las 10 filas.
      expect(result.current.table.getRowModel().rows).toHaveLength(10);
      // Pero el total y las páginas los define el backend.
      expect(result.current.table.getRowCount()).toBe(240);
      expect(result.current.table.getPageCount()).toBe(10);
    });

    it('informa la consulta inicial', () => {
      const onQueryChange = vi.fn<(query: TableQuery) => void>();

      renderTable({
        tableId: 'servidor-consulta',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
        onQueryChange,
      });

      expect(onQueryChange).toHaveBeenCalledWith({
        page: 1,
        pageSize: 25,
        sorting: [],
        search: '',
      });
    });

    it('informa el cambio de página en base 1', () => {
      const onQueryChange = vi.fn<(query: TableQuery) => void>();
      const { result } = renderTable({
        tableId: 'servidor-pagina',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
        onQueryChange,
      });

      act(() => {
        result.current.table.nextPage();
      });

      expect(onQueryChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 25 }),
      );
    });

    it('informa el orden solicitado', () => {
      const onQueryChange = vi.fn<(query: TableQuery) => void>();
      const { result } = renderTable({
        tableId: 'servidor-orden',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
        onQueryChange,
      });

      act(() => {
        result.current.table.getColumn('amount')?.toggleSorting(true);
      });

      expect(onQueryChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ sorting: [{ id: 'amount', desc: true }] }),
      );
    });

    it('no notifica dos veces la misma consulta', () => {
      const onQueryChange = vi.fn<(query: TableQuery) => void>();
      const { rerender } = renderTable({
        tableId: 'servidor-estable',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
        onQueryChange,
      });

      rerender();
      rerender();

      expect(onQueryChange).toHaveBeenCalledTimes(1);
    });

    it('no notifica nada en modo cliente', () => {
      const onQueryChange = vi.fn<(query: TableQuery) => void>();

      renderTable({ tableId: 'cliente-sin-aviso', onQueryChange });

      expect(onQueryChange).not.toHaveBeenCalled();
    });
  });
});
