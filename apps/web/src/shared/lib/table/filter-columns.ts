import type { SelectableColumn } from '@/shared/types/table';

/**
 * A partir de este número de columnas se ofrece un buscador.
 *
 * Por debajo se encuentran antes a ojo que escribiendo, y el campo solo resta
 * sitio a la lista.
 */
export const COLUMN_SEARCH_THRESHOLD = 5;

/**
 * Filtra columnas por su etiqueta, sin distinguir mayúsculas.
 *
 * Se pasa a minúsculas con la configuración regional española y no con la del
 * navegador: las etiquetas están en español y el resultado no debe depender del
 * idioma en que el usuario tenga configurado el sistema.
 *
 * Los acentos sí se distinguen: buscar "numero" no encuentra "Número".
 */
export function filterColumnsByLabel(
  columns: SelectableColumn[],
  search: string,
): SelectableColumn[] {
  const term = search.trim().toLocaleLowerCase('es');

  if (term.length === 0) {
    return columns;
  }

  return columns.filter((column) => column.label.toLocaleLowerCase('es').includes(term));
}
