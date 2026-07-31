/**
 * Operadores del constructor de filtros.
 *
 * La lista es cerrada a propósito: un filtro guardado en una vista debe seguir
 * siendo interpretable dentro de meses, y un operador libre no lo garantiza.
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

/** Texto que ve el usuario. Los identificadores nunca se muestran. */
export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  es: 'es',
  noEs: 'no es',
  contiene: 'contiene',
  empiezaPor: 'empieza por',
  terminaPor: 'termina por',
  vacio: 'vacío',
  noVacio: 'no vacío',
};

/** Operadores que preguntan por la ausencia de dato y no admiten valor. */
const VALUELESS_OPERATORS: readonly FilterOperator[] = ['vacio', 'noVacio'];

export function operatorNeedsValue(operator: FilterOperator): boolean {
  return !VALUELESS_OPERATORS.includes(operator);
}

/**
 * Una condición del constructor de filtros.
 *
 * El identificador es de la condición, no de la columna: el usuario puede
 * declarar varias condiciones sobre el mismo campo.
 */
export interface AdvancedFilter {
  id: string;
  columnId: string;
  operator: FilterOperator;
  /** Se ignora cuando el operador no lo necesita. */
  value: string;
}
