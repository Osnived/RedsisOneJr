/** Marca visual para un valor ausente. Una celda vacía se confunde con un fallo. */
export const EMPTY_CELL = '—';

/**
 * Convierte un valor desconocido en texto presentable.
 *
 * Vive en el framework y no en cada columna para que toda la plataforma muestre
 * las fechas, los booleanos y los valores vacíos de la misma forma.
 */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_CELL;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? EMPTY_CELL : value.toLocaleDateString('es');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString('es') : EMPTY_CELL;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((entry) => formatCellValue(entry)).join(', ') : EMPTY_CELL;
  }

  if (typeof value === 'object') {
    // Un objeto sin render propio no se puede mostrar de forma útil; se marca
    // como vacío en lugar de imprimir "[object Object]".
    return EMPTY_CELL;
  }

  return String(value);
}
