import {
  operatorNeedsValue,
  type AdvancedFilter,
  type ColumnDefinition,
  type FilterOperator,
} from '@/shared/types/table';

/**
 * Aplica las condiciones del constructor de filtros sobre los datos.
 *
 * Es una función pura y no una capacidad del motor de tablas a propósito: así se
 * prueba sin montar nada, la semántica de cada operador queda en un solo sitio y
 * no depende de cómo TanStack combine sus filtros internos. El motor recibe los
 * datos ya filtrados y su paginación y sus recuentos salen correctos sin más.
 *
 * Las condiciones se combinan con Y: cada filtro que el usuario añade restringe
 * el resultado, que es lo que espera de un constructor.
 */
export function applyAdvancedFilters<TData>(
  data: TData[],
  filters: AdvancedFilter[],
  columns: ColumnDefinition<TData>[],
): TData[] {
  const active = filters.filter(isComplete);

  if (active.length === 0) {
    return data;
  }

  const accessors = new Map(columns.map((column) => [column.id, column.accessor]));

  return data.filter((row) =>
    active.every((filter) => {
      const accessor = accessors.get(filter.columnId);

      // Una condición sobre una columna que ya no existe se ignora en lugar de
      // vaciar la tabla: puede venir de una vista guardada hace meses.
      return accessor ? matches(accessor(row), filter) : true;
    }),
  );
}

/**
 * Una condición a medio escribir no filtra.
 *
 * Sin esto, elegir "contiene" vaciaría la tabla hasta teclear la primera letra,
 * y el usuario creería que no hay resultados.
 */
function isComplete(filter: AdvancedFilter): boolean {
  return !operatorNeedsValue(filter.operator) || filter.value.trim().length > 0;
}

function matches(value: unknown, filter: AdvancedFilter): boolean {
  const text = toFilterText(value);
  const term = filter.value.trim().toLocaleLowerCase('es');

  return evaluate(filter.operator, text, term);
}

function evaluate(operator: FilterOperator, text: string, term: string): boolean {
  switch (operator) {
    case 'es':
      return text === term;
    case 'noEs':
      return text !== term;
    case 'contiene':
      return text.includes(term);
    case 'empiezaPor':
      return text.startsWith(term);
    case 'terminaPor':
      return text.endsWith(term);
    case 'vacio':
      return text.length === 0;
    case 'noVacio':
      return text.length > 0;
  }
}

/**
 * Texto sobre el que se compara una condición.
 *
 * No se reutiliza `formatCellValue` porque marca los valores ausentes con un
 * guion, y entonces "vacío" no encontraría nada. Aquí un valor ausente debe ser
 * exactamente la cadena vacía.
 *
 * Las fechas y los booleanos se comparan como los ve el usuario; el resto, como
 * está en el dato, igual que ya hacen el orden y la búsqueda global.
 */
export function toFilterText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ''
      : value.toLocaleDateString('es').toLocaleLowerCase('es');
  }

  if (typeof value === 'boolean') {
    return value ? 'sí' : 'no';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toFilterText(entry)).join(', ');
  }

  if (typeof value === 'object') {
    return '';
  }

  return String(value).toLocaleLowerCase('es');
}
