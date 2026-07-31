/** Marca visual para una fecha ausente o ilegible. Igual que en las celdas de tabla. */
export const EMPTY_DATE = '—';

/** Formas en las que la plataforma muestra una fecha. */
export type DateTimeFormat = 'date' | 'time' | 'dateTime';

/**
 * Convierte un instante en el texto que ve el usuario.
 *
 * Toda la plataforma muestra las fechas igual porque todas pasan por aquí. Es la
 * mitad pura de la regla global de DateTime: ninguna feature formatea fechas por
 * su cuenta (ver CODING_STANDARDS.md).
 *
 * Acepta el texto ISO que entregan los contratos y también un `Date`, porque los
 * datos vienen del backend en ISO y algún accesor de tabla ya devuelve `Date`.
 *
 * Una fecha inválida se marca como ausente en lugar de imprimir "Invalid Date":
 * un dato ilegible no debe parecer un dato.
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  format: DateTimeFormat = 'dateTime',
): string {
  const date = toDate(value);

  if (date === null) {
    return EMPTY_DATE;
  }

  if (format === 'date') {
    return date.toLocaleDateString('es');
  }

  if (format === 'time') {
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  return `${date.toLocaleDateString('es')} ${date.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * Valor del atributo `dateTime` de la etiqueta `<time>`.
 *
 * Es el instante completo en ISO, independiente del formato mostrado: lo que se
 * ve puede ser solo la fecha, pero lo que se anuncia debe ser exacto.
 */
export function toIsoString(value: string | Date | null | undefined): string | undefined {
  return toDate(value)?.toISOString();
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
