import type { AdvancedFilter } from './filter';

/**
 * Estado de consulta de una tabla.
 *
 * En modo servidor este estado se envía al backend; en modo cliente lo resuelve
 * el propio motor. La forma es la misma en ambos casos para que una pantalla
 * pueda pasar de un modo a otro sin cambiar su contrato.
 */
export interface TableSort {
  id: string;
  desc: boolean;
}

export interface TableQuery {
  page: number;
  pageSize: number;
  sorting: TableSort[];
  search: string;
  /** Condiciones del constructor de filtros, combinadas con Y. */
  filters: AdvancedFilter[];
}

/**
 * Modo de operación:
 * - `client`: el motor ordena, filtra y pagina sobre los datos recibidos.
 * - `server`: el backend lo hace y el motor solo refleja el resultado.
 */
export type TableMode = 'client' | 'server';

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
