import {
  STANDARD_TICKET_COLUMNS,
  operatorNeedsValue,
  type DataQuery,
  type FilterOperator,
  type QueryFilter,
  type QuerySort,
  type Ticket,
  type TicketMetadataValue,
} from '@redsis/contracts';
import type { TicketPage } from '../ticket.types';

/**
 * Resolución de una consulta sobre tickets ya cargados en memoria.
 *
 * Es lo que hace un Provider cuyo origen **no sabe** filtrar, ordenar ni paginar
 * por su cuenta. Un origen que sí sepa traducirá la misma `DataQuery` a su propio
 * lenguaje y no usará nada de este archivo; quien llama no nota la diferencia,
 * que es justo lo que pide el §26 del MVP.
 *
 * Es lógica pura: sin Nest, sin red y sin estado, así que se prueba sin montar
 * nada.
 *
 * Los filtros comparan sobre **el dato almacenado y no sobre lo que se ve**
 * (`en-ruta`, no "En ruta"). Es la misma semántica que ya tenían el orden y la
 * búsqueda del framework de tablas: cambiarla aquí haría que el mismo filtro
 * guardado diera resultados distintos según lo resolviera el cliente o el
 * servidor.
 */

/** Campo del ticket al que apunta cada columna estándar. */
const STANDARD_KEYS = new Map(
  STANDARD_TICKET_COLUMNS.map((column) => [column.id, column.key] as const),
);

/**
 * Valor sobre el que operan la búsqueda, el orden y los filtros.
 *
 * Busca primero entre los campos del contrato y después en los datos adicionales
 * del proveedor, de modo que una columna configurada sobre `metadata` se pueda
 * filtrar igual que una estándar.
 */
export function valueOf(ticket: Ticket, columnId: string): TicketMetadataValue {
  const key = STANDARD_KEYS.get(columnId) ?? columnId;

  if (key in ticket) {
    const value = ticket[key as keyof Ticket];

    // `metadata` es lo único que no es escalar. Nadie filtra por el objeto entero.
    return typeof value === 'object' && value !== null ? null : value;
  }

  return ticket.metadata[columnId] ?? null;
}

function asText(value: TicketMetadataValue): string {
  return value === null ? '' : String(value);
}

/**
 * Texto sobre el que se compara: sin mayúsculas y sin acentos.
 *
 * Buscar "clinica" tiene que encontrar "Clínica Santa Fe". Quien escribe en la
 * caja de búsqueda no está transcribiendo un dato, está recordándolo, y obligarle
 * a acertar la tilde hace que la búsqueda parezca rota.
 *
 * Se normaliza descomponiendo y quitando los diacríticos, no con una tabla de
 * equivalencias: así funciona igual para cualquier idioma que llegue de un
 * proveedor externo.
 */
function comparable(value: TicketMetadataValue): string {
  return asText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

function matches(operator: FilterOperator, actual: TicketMetadataValue, expected: string): boolean {
  const text = comparable(actual);
  const target = comparable(expected.trim());

  switch (operator) {
    case 'es':
      return text === target;
    case 'noEs':
      return text !== target;
    case 'contiene':
      return text.includes(target);
    case 'empiezaPor':
      return text.startsWith(target);
    case 'terminaPor':
      return text.endsWith(target);
    case 'vacio':
      return text.length === 0;
    case 'noVacio':
      return text.length > 0;
  }
}

function passesFilters(ticket: Ticket, filters: QueryFilter[]): boolean {
  // Las condiciones se combinan con Y, igual que en el constructor de filtros.
  return filters.every((filter) => {
    if (operatorNeedsValue(filter.operator) && filter.value.trim().length === 0) {
      // Una condición a medio escribir no debe vaciar la tabla mientras se teclea.
      return true;
    }

    return matches(filter.operator, valueOf(ticket, filter.columnId), filter.value);
  });
}

/**
 * Búsqueda general.
 *
 * Recorre las columnas estándar y los datos adicionales, porque quien escribe en
 * la caja de búsqueda no sabe —ni tiene por qué saber— en qué campo vive lo que
 * recuerda del ticket.
 */
function passesSearch(ticket: Ticket, search: string): boolean {
  const target = comparable(search.trim());

  if (target.length === 0) {
    return true;
  }

  const standard = STANDARD_TICKET_COLUMNS.map((column) => valueOf(ticket, column.id));
  const additional = Object.values(ticket.metadata);

  return [...standard, ...additional].some((value) => comparable(value).includes(target));
}

function compare(left: TicketMetadataValue, right: TicketMetadataValue): number {
  if (left === right) {
    return 0;
  }

  // Un valor ausente va al final en orden ascendente: lo que falta interesa menos
  // que lo que existe, se ordene por lo que se ordene.
  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return asText(left).localeCompare(asText(right));
}

function applySorting(tickets: Ticket[], sorting: QuerySort[]): Ticket[] {
  if (sorting.length === 0) {
    return tickets;
  }

  return [...tickets].sort((left, right) => {
    for (const sort of sorting) {
      const result = compare(valueOf(left, sort.id), valueOf(right, sort.id));

      if (result !== 0) {
        return sort.desc ? -result : result;
      }
    }

    return 0;
  });
}

/**
 * Resuelve la consulta completa.
 *
 * El total se cuenta **después de filtrar y antes de paginar**: es el número de
 * registros que cumplen la consulta, no los que caben en la página ni los que hay
 * en el origen. La paginación de la tabla depende de que ese número sea exacto.
 */
export function applyQuery(tickets: Ticket[], query: DataQuery): TicketPage {
  const matching = tickets
    .filter((ticket) => passesSearch(ticket, query.search))
    .filter((ticket) => passesFilters(ticket, query.filters));

  const ordered = applySorting(matching, query.sorting);
  const from = (query.page - 1) * query.pageSize;

  return {
    items: ordered.slice(from, from + query.pageSize),
    total: matching.length,
  };
}
