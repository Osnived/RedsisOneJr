import type { TableSort } from './query';

/**
 * Preferencias que el usuario ajusta y espera reencontrar.
 *
 * No incluye la página actual ni la búsqueda: son transitorias, y restaurarlas
 * al volver a entrar resultaría desconcertante.
 */
export interface TablePreferences {
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
  pageSize: number;
  sorting: TableSort[];
}

/**
 * Versión del formato almacenado. Si cambia la forma de las preferencias, este
 * número se incrementa y las preferencias antiguas se descartan en lugar de
 * provocar errores al leerlas.
 */
export const TABLE_PREFERENCES_VERSION = 1;

export interface StoredTablePreferences {
  version: number;
  preferences: TablePreferences;
}
