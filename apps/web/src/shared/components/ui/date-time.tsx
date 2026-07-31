import { formatDateTime, toIsoString, type DateTimeFormat } from '@/shared/lib/format-date-time';

interface DateTimeProps {
  /** Instante en ISO 8601, como lo entregan los contratos, o un `Date`. */
  value: string | Date | null | undefined;
  format?: DateTimeFormat;
  className?: string;
}

/**
 * Muestra una fecha y hora.
 *
 * Es el único componente que renderiza fechas en la plataforma: ninguna feature
 * las formatea por su cuenta (ver CODING_STANDARDS.md). Así el día que cambie el
 * formato, la zona horaria o el idioma, cambia en un solo archivo.
 *
 * Usa `<time dateTime>` para que el instante exacto quede en el marcado aunque
 * en pantalla se muestre abreviado: un lector de pantalla y un buscador leen el
 * valor completo, no el texto recortado.
 */
export function DateTime({
  value,
  format = 'dateTime',
  className,
}: DateTimeProps): React.JSX.Element {
  const iso = toIsoString(value);
  const text = formatDateTime(value, format);

  if (iso === undefined) {
    return <span className={className}>{text}</span>;
  }

  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}
