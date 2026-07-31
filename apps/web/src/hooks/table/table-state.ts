import type { RowSelectionState, Updater } from '@tanstack/react-table';
import type { TablePreferences } from '@/types/table';

/**
 * Utilidades de estado del motor de tablas.
 *
 * Están fuera del hook porque son funciones puras: no dependen de React y se
 * pueden probar sin montar nada. Sacarlas dejó el hook centrado en orquestar.
 */

/** TanStack entrega el valor nuevo o una función que lo calcula. */
export function resolveUpdater<TValue>(updater: Updater<TValue>, current: TValue): TValue {
  return typeof updater === 'function'
    ? (updater as (previous: TValue) => TValue)(current)
    : updater;
}

/** Traduce el mapa de identificadores marcados a las filas correspondientes. */
export function selectRows<TData>(
  data: TData[],
  getRowId: (row: TData) => string,
  selection: RowSelectionState,
): TData[] {
  return data.filter((row) => selection[getRowId(row)] === true);
}

/**
 * Determina si el usuario cambió algo respecto al estado inicial.
 *
 * Se compara el conjunto completo en lugar de campo por campo para que añadir
 * una preferencia nueva no exija recordar actualizar esta comprobación.
 */
export function differsFromDefaults(
  preferences: TablePreferences,
  defaults: TablePreferences,
): boolean {
  return JSON.stringify(preferences) !== JSON.stringify(defaults);
}
