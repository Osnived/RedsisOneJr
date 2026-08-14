import type { FilterOperator, QueryFilter } from '@redsis/contracts';

/**
 * Operadores del constructor de filtros.
 *
 * La lista **vive en los contratos compartidos** y aquí solo se re-exporta. En
 * modo servidor un filtro viaja a la API y el Provider lo traduce al lenguaje de
 * su origen (`columnId = valor` en RedsisOne, `campo__equal` en Baserow), así que
 * declararlo en dos sitios permitiría que la tabla ofreciera un operador que el
 * servidor no sabe interpretar.
 *
 * Lo que sí es de este lado son las etiquetas: son presentación.
 */
export { FILTER_OPERATORS, operatorNeedsValue } from '@redsis/contracts';
export type { FilterOperator } from '@redsis/contracts';

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

/**
 * Una condición del constructor de filtros.
 *
 * Es el `QueryFilter` del contrato compartido bajo el nombre que ya usaba el
 * framework de tablas. Se conserva el alias porque el nombre describe mejor de
 * qué se habla dentro de la tabla avanzada, y renombrarlo en veinte archivos no
 * aportaría nada.
 */
export type AdvancedFilter = QueryFilter;
