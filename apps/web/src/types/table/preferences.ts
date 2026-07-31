import type { TableSort } from './query';

/**
 * Preferencias de una tabla que se conservan entre sesiones.
 *
 * Incluye el estado completo de la vista: qué columnas se ven, en qué orden, de
 * qué ancho, cómo está ordenada, qué se buscó y en qué página quedó el usuario.
 * El objetivo es que recargar la página devuelva la tabla tal como se dejó.
 */
export interface TablePreferences {
  columnVisibility: Record<string, boolean>;

  /** Orden de las columnas por id. Vacío significa el orden natural declarado. */
  columnOrder: string[];

  columnSizing: Record<string, number>;

  pageSize: number;

  /** Página actual en base 1. */
  page: number;

  sorting: TableSort[];

  /** Texto de la búsqueda global. */
  search: string;
}

/**
 * Versión del formato almacenado.
 *
 * Si cambia la forma de las preferencias, este número se incrementa y las
 * preferencias antiguas se descartan en lugar de provocar errores al leerlas.
 *
 * Historial:
 * - 1: visibilidad, anchos, tamaño de página y ordenamiento.
 * - 2: se añaden orden de columnas, página actual y búsqueda.
 */
export const TABLE_PREFERENCES_VERSION = 2;

export interface StoredTablePreferences {
  version: number;
  preferences: TablePreferences;
}
