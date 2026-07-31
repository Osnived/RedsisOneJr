import type { ColumnDefinition } from '@/shared/types/table';

/**
 * Catálogo de identificadores de tabla de la plataforma.
 *
 * El `tableId` es la clave con la que se guardan las preferencias del usuario.
 * Si dos tablas distintas comparten identificador, se sobrescriben las
 * preferencias entre ellas y el usuario ve columnas que no pidió. Declararlos en
 * un único sitio hace imposible ese choque.
 */
export const TABLE_IDS = {
  TICKETS: 'tickets',
  USERS: 'users',
} as const;

export type TableId = (typeof TABLE_IDS)[keyof typeof TABLE_IDS];

/**
 * Declara el conjunto de columnas de un módulo.
 *
 * Cada módulo llama a esta función en su archivo `<dominio>.columns.ts`. Aporta
 * dos garantías que una constante suelta no da:
 *
 * 1. Valida que no haya identificadores repetidos. Dos columnas con el mismo id
 *    corrompen en silencio la visibilidad y el ancho guardados, porque ambas
 *    escriben en la misma clave de preferencias.
 * 2. Al invocarse en el ámbito del módulo, la identidad del arreglo es estable,
 *    que es justo lo que el DataTable necesita para no reconstruir las columnas
 *    en cada render.
 *
 * Falla al cargar el módulo y no en tiempo de ejecución: un error de definición
 * se descubre al arrancar, no cuando un usuario abre la pantalla.
 */
export function defineColumns<TData>(
  columns: ColumnDefinition<TData>[],
): ColumnDefinition<TData>[] {
  assertUniqueIds(columns);
  return columns;
}

function assertUniqueIds<TData>(columns: ColumnDefinition<TData>[]): void {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const column of columns) {
    if (seen.has(column.id)) {
      duplicated.add(column.id);
    }

    seen.add(column.id);
  }

  if (duplicated.size > 0) {
    throw new Error(
      `Definición de columnas inválida: identificadores repetidos (${[...duplicated].join(', ')})`,
    );
  }
}
