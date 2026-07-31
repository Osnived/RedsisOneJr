import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { TABLE_PREFERENCES_VERSION, type TablePreferences } from '@/types/table';
import { tablePreferencesKey, useTablePreferences } from './use-table-preferences';

const DEFAULTS: TablePreferences = {
  columnVisibility: { notes: false },
  columnOrder: [],
  columnSizing: { amount: 120 },
  pageSize: 25,
  page: 1,
  sorting: [],
  search: '',
};

function storedValue(tableId: string): unknown {
  const raw = localStorage.getItem(tablePreferencesKey(tableId));
  return raw ? JSON.parse(raw) : null;
}

describe('useTablePreferences', () => {
  it('arranca con los valores iniciales cuando no hay nada guardado', () => {
    const { result } = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

    expect(result.current.preferences).toEqual(DEFAULTS);
  });

  it('persiste un cambio parcial sin perder el resto', () => {
    const { result } = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

    act(() => {
      result.current.update({ pageSize: 50 });
    });

    expect(result.current.preferences.pageSize).toBe(50);
    expect(result.current.preferences.columnSizing).toEqual({ amount: 120 });
    expect(storedValue('tabla-a')).toMatchObject({
      version: TABLE_PREFERENCES_VERSION,
      preferences: { pageSize: 50 },
    });
  });

  it('recupera lo guardado al volver a montar', () => {
    const first = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

    act(() => {
      first.result.current.update({ sorting: [{ id: 'name', desc: true }] });
    });
    first.unmount();

    const second = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

    expect(second.result.current.preferences.sorting).toEqual([{ id: 'name', desc: true }]);
  });

  it('mantiene separadas las preferencias de tablas distintas', () => {
    const tableA = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

    act(() => {
      tableA.result.current.update({ pageSize: 100 });
    });

    const tableB = renderHook(() => useTablePreferences('tabla-b', DEFAULTS));

    expect(tableB.result.current.preferences.pageSize).toBe(25);
  });

  it('restablece los valores iniciales y borra lo almacenado', () => {
    const { result } = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

    act(() => {
      result.current.update({ pageSize: 100 });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.preferences).toEqual(DEFAULTS);
    expect(storedValue('tabla-a')).toBeNull();
  });

  describe('datos almacenados no válidos', () => {
    it('ignora un JSON corrupto', () => {
      localStorage.setItem(tablePreferencesKey('tabla-a'), '{no es json');

      const { result } = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

      expect(result.current.preferences).toEqual(DEFAULTS);
    });

    it('descarta una versión anterior del formato', () => {
      localStorage.setItem(
        tablePreferencesKey('tabla-a'),
        JSON.stringify({
          version: TABLE_PREFERENCES_VERSION - 1,
          preferences: { ...DEFAULTS, pageSize: 100 },
        }),
      );

      const { result } = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

      expect(result.current.preferences.pageSize).toBe(25);
    });

    it('descarta una estructura incompleta', () => {
      localStorage.setItem(
        tablePreferencesKey('tabla-a'),
        JSON.stringify({ version: TABLE_PREFERENCES_VERSION, preferences: { pageSize: 50 } }),
      );

      const { result } = renderHook(() => useTablePreferences('tabla-a', DEFAULTS));

      expect(result.current.preferences).toEqual(DEFAULTS);
    });
  });

  it('muestra una columna nueva aunque existan preferencias anteriores', () => {
    localStorage.setItem(
      tablePreferencesKey('tabla-a'),
      JSON.stringify({
        version: TABLE_PREFERENCES_VERSION,
        preferences: { ...DEFAULTS, columnVisibility: { notes: true } },
      }),
    );

    const defaultsWithNewColumn: TablePreferences = {
      ...DEFAULTS,
      columnVisibility: { notes: false, extra: false },
    };

    const { result } = renderHook(() => useTablePreferences('tabla-a', defaultsWithNewColumn));

    // La preferencia guardada gana sobre el valor inicial de esa columna...
    expect(result.current.preferences.columnVisibility['notes']).toBe(true);
    // ...pero la columna nueva conserva su valor inicial.
    expect(result.current.preferences.columnVisibility['extra']).toBe(false);
  });
});
