import type { DataQuery, QuerySort } from '@redsis/contracts';

/**
 * Estado de consulta de una tabla.
 *
 * En modo servidor este estado **viaja a la API**, así que su forma vive en los
 * contratos compartidos y aquí solo se le pone el nombre con el que se habla de él
 * dentro del framework de tablas. Declararla en dos sitios permitiría que la tabla
 * pidiera algo que el servidor no sabe interpretar.
 *
 * En modo cliente la resuelve el propio motor. La forma es la misma en ambos casos
 * para que una pantalla pueda pasar de un modo a otro sin cambiar su contrato.
 */
export type TableSort = QuerySort;

export type TableQuery = DataQuery;

/**
 * Modo de operación:
 * - `client`: el motor ordena, filtra y pagina sobre los datos recibidos.
 * - `server`: el backend lo hace y el motor solo refleja el resultado.
 */
export type TableMode = 'client' | 'server';

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
