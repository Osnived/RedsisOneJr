import type { ColumnAlignment } from '@/types/table';

/**
 * Clases de alineación compartidas por la cabecera y el cuerpo.
 *
 * Viven aquí para que ambos no puedan alinearse de forma distinta: si la
 * cabecera dice derecha y la celda izquierda, la columna se lee torcida.
 */
export const ALIGNMENT_CLASS: Record<ColumnAlignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};
