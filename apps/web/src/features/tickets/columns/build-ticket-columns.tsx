import {
  TICKET_COLUMN_BINDINGS,
  TICKET_COLUMN_DATA_TYPES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketColumnConfig,
  type TicketColumnDataType,
  type TicketMetadataValue,
} from '@redsis/contracts';
import { defineColumns } from '@/shared/lib/table/registry';
import type { ColumnAlignment, ColumnDefinition } from '@/shared/types/table';
import { TicketPriorityBadge, TicketStatusBadge } from '../ticket-badges';

/**
 * Construye las columnas de la tabla a partir de la configuración del proyecto.
 *
 * Es el **Column Adapter**: traduce lo que declara una fuente de datos a lo que
 * entiende el framework de tablas. Existe porque cada proyecto tiene su propia
 * estructura —un tablero de RedsisOne no tiene las mismas columnas que otro— y una
 * lista fija en el código obligaría a desplegar cada vez que apareciera un campo.
 *
 * ## Por qué el framework no sabe de tipos de dato
 *
 * `ColumnDefinition` no ha cambiado. El tipo de dato pertenece al contrato de
 * configuración, no al motor de tablas: aquí se usa para decidir cómo se lee el
 * valor, cómo se dibuja y cómo se alinea, y lo que sale es una columna corriente.
 * Así el framework sigue sin conocer ningún dominio, que es lo que le permite
 * servir a los nueve módulos previstos.
 *
 * Se sigue pasando por `defineColumns`, así que una configuración con
 * identificadores repetidos falla al construirse en lugar de corromper en silencio
 * las preferencias del usuario.
 */

/**
 * Ancho inicial según el tipo de dato.
 *
 * Se deriva del tipo y no se configura: pedir el ancho de cada columna al
 * administrar una fuente sería preguntarle por algo que el usuario ya puede
 * ajustar arrastrando, y que además se le guarda.
 */
const WIDTH_BY_TYPE: Record<TicketColumnDataType, number> = {
  text: 180,
  number: 120,
  boolean: 110,
  dateTime: 150,
  status: 130,
  select: 150,
  user: 170,
  location: 180,
  currency: 130,
};

const ALIGNMENT_BY_TYPE: Partial<Record<TicketColumnDataType, ColumnAlignment>> = {
  number: 'right',
  currency: 'right',
  boolean: 'center',
  status: 'center',
};

/**
 * Celdas con render propio del dominio.
 *
 * Se resuelven por identificador de columna y no por tipo: `status` como tipo
 * describe "valor de un catálogo cerrado", pero solo el estado y la prioridad de un
 * ticket tienen mapa de colores. Una columna adicional que un proyecto declare como
 * `status` se muestra como texto, que es lo honesto mientras nadie declare sus
 * colores.
 */
const DOMAIN_CELLS: Record<string, (ticket: Ticket) => React.ReactNode> = {
  number: (ticket) => <span className="font-medium">{ticket.number}</span>,
  status: (ticket) => <TicketStatusBadge status={ticket.status} />,
  priority: (ticket) => <TicketPriorityBadge priority={ticket.priority} />,
};

/**
 * Traducción de código a etiqueta al agrupar.
 *
 * El grupo debe leerse "En ruta", no "en-ruta". Traducir el código es conocimiento
 * del dominio y por eso vive aquí y no en el framework.
 */
const DOMAIN_GROUP_LABELS: Record<string, Record<string, string>> = {
  status: TICKET_STATUS_LABELS,
  priority: TICKET_PRIORITY_LABELS,
};

function labelOf(labels: Record<string, string>, value: unknown): string {
  return typeof value === 'string' ? (labels[value] ?? value) : String(value);
}

/**
 * Lee el valor de una fila para una columna configurada.
 *
 * Un campo estándar se lee del ticket y una columna adicional de su `metadata`. Si
 * la configuración apunta a algo que el origen no entrega, se devuelve null en
 * lugar de fallar: una fuente mal configurada debe enseñar una celda vacía, no
 * romper la pantalla entera.
 */
function readValue(ticket: Ticket, config: TicketColumnConfig): TicketMetadataValue {
  if (config.binding === TICKET_COLUMN_BINDINGS.METADATA) {
    return ticket.metadata[config.key] ?? null;
  }

  const value = ticket[config.key as keyof Ticket];

  return typeof value === 'object' && value !== null ? null : (value as TicketMetadataValue);
}

/**
 * Accesor de la columna.
 *
 * Las fechas se devuelven como `Date` y no como texto para que el orden sea
 * cronológico y el framework las dibuje con el componente compartido. Es la misma
 * razón por la que el origen las transporta en ISO 8601: el texto ordena bien por
 * casualidad, y esa casualidad se rompe con otro formato.
 */
function buildAccessor(config: TicketColumnConfig): (ticket: Ticket) => unknown {
  if (config.type === TICKET_COLUMN_DATA_TYPES.DATE_TIME) {
    return (ticket) => {
      const value = readValue(ticket, config);

      return typeof value === 'string' && value.length > 0 ? new Date(value) : null;
    };
  }

  if (config.type === TICKET_COLUMN_DATA_TYPES.NUMBER) {
    return (ticket) => {
      const value = readValue(ticket, config);

      // Un proveedor externo puede entregar los números como texto (RedsisOne lo
      // hace). Se convierten aquí para que ordenar signifique lo que parece.
      return typeof value === 'string' && value.trim().length > 0 ? Number(value) : value;
    };
  }

  return (ticket) => readValue(ticket, config);
}

function buildColumn(config: TicketColumnConfig): ColumnDefinition<Ticket> {
  const cell = DOMAIN_CELLS[config.id];
  const groupLabels = DOMAIN_GROUP_LABELS[config.id];
  const alignment = ALIGNMENT_BY_TYPE[config.type];

  return {
    id: config.id,
    header: config.label,
    accessor: buildAccessor(config),
    width: WIDTH_BY_TYPE[config.type],
    // Una columna obligatoria no se puede ocultar: el número identifica el
    // servicio durante toda su vida.
    hideable: !config.isRequired,
    hiddenByDefault: !config.isVisible,
    groupable: config.isGroupable,
    ...(alignment === undefined ? {} : { align: alignment }),
    ...(cell === undefined ? {} : { cell }),
    ...(groupLabels === undefined
      ? {}
      : { groupLabel: (value: unknown) => labelOf(groupLabels, value) }),
  };
}

/**
 * Columnas de la tabla, en el orden que declara el proyecto.
 *
 * El resultado debe memoizarse o declararse fuera del componente: si su identidad
 * cambia en cada render, el motor reconstruye las columnas y la tabla pierde su
 * estado interno.
 */
export function buildTicketColumns(
  configs: readonly TicketColumnConfig[],
): ColumnDefinition<Ticket>[] {
  const ordered = [...configs].sort((left, right) => left.order - right.order);

  return defineColumns(ordered.map((config) => buildColumn(config)));
}
