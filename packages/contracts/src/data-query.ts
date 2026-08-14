/**
 * Forma de una consulta de datos: página, orden, búsqueda y condiciones.
 *
 * Vive en los contratos compartidos y no en el framework de tablas porque en modo
 * servidor esta consulta **viaja a la API**: la declara el frontend, la valida el
 * backend y la traduce el Provider al lenguaje de su origen. Tenerla en un solo
 * sitio es lo que impide que la tabla pregunte una cosa y el servidor entienda
 * otra.
 *
 * Es neutra al dominio a propósito. La consumen Tickets hoy y cualquier módulo con
 * tabla en modo servidor mañana.
 */

import { z } from 'zod';

/**
 * Operadores del constructor de filtros.
 *
 * La lista es cerrada a propósito: un filtro guardado en una vista debe seguir
 * siendo interpretable dentro de meses, y un operador libre no lo garantiza.
 *
 * Los siete son los que pidió el MVP 9 del Release 0.5, y son también el
 * vocabulario que cada Provider tiene que saber traducir: `es` se convierte en
 * `columnId = valor` para RedsisOne y en `campo__equal` para Baserow. Ampliar la
 * lista obliga a revisar todos los proveedores, y por eso no se amplía a la
 * ligera.
 */
export const FILTER_OPERATORS = [
  'es',
  'noEs',
  'contiene',
  'empiezaPor',
  'terminaPor',
  'vacio',
  'noVacio',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

/** Operadores que preguntan por la ausencia de dato y no admiten valor. */
const VALUELESS_OPERATORS: readonly FilterOperator[] = ['vacio', 'noVacio'];

export function operatorNeedsValue(operator: FilterOperator): boolean {
  return !VALUELESS_OPERATORS.includes(operator);
}

/**
 * Una condición sobre una columna.
 *
 * El identificador es de la condición, no de la columna: el usuario puede declarar
 * varias condiciones sobre el mismo campo.
 *
 * `columnId` es el identificador de la columna **en nuestro modelo**, nunca el del
 * proveedor. Traducirlo al campo real del origen es trabajo del Provider, y es lo
 * que permite que la misma vista guardada funcione con RedsisOne y con Baserow.
 */
export interface QueryFilter {
  id: string;
  columnId: string;
  operator: FilterOperator;
  /** Se ignora cuando el operador no lo necesita. */
  value: string;
}

export interface QuerySort {
  /** Identificador de la columna en nuestro modelo. */
  id: string;
  desc: boolean;
}

/**
 * Consulta completa de un listado.
 *
 * Se pagina por número de página y no por cursor porque el framework de tablas
 * dibuja páginas numeradas y ofrece saltar a una concreta. Un origen que solo
 * sepa paginar por cursor lo resuelve en su Provider; al revés —exponer cursores
 * a una tabla que enseña "página 3 de 12"— obligaría a rehacer la paginación de
 * toda la plataforma por un solo proveedor.
 */
export interface DataQuery {
  page: number;
  pageSize: number;
  /** Búsqueda general. Cadena vacía significa "sin búsqueda". */
  search: string;
  sorting: QuerySort[];
  /** Condiciones del constructor de filtros, combinadas con Y. */
  filters: QueryFilter[];
}

export const querySortSchema = z.object({
  id: z.string().min(1),
  desc: z.boolean(),
});

export const queryFilterSchema = z.object({
  id: z.string().min(1),
  columnId: z.string().min(1),
  operator: z.enum(FILTER_OPERATORS),
  value: z.string(),
});

/**
 * Límite máximo de registros por página.
 *
 * Existe para que una petición no pueda pedir el origen entero: §23 del MVP exige
 * no cargar tickets indiscriminadamente en memoria, y un proveedor externo cobra
 * o limita por volumen. Coincide con el de `paginationSchema` para que las dos
 * puertas de la plataforma admitan lo mismo.
 */
export const MAX_PAGE_SIZE = 100;

export const dataQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(25),
  search: z.string().trim().default(''),
  sorting: z.array(querySortSchema).default([]),
  filters: z.array(queryFilterSchema).default([]),
});

export type DataQueryInput = z.infer<typeof dataQuerySchema>;
