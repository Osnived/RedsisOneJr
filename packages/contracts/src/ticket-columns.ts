/**
 * Configuración de columnas de Tickets.
 *
 * Cada proyecto —cada tablero del proveedor— tiene su propia estructura: no todos
 * los clientes registran las mismas cosas, y una tabla rígida de columnas fijas
 * obligaría a desplegar cada vez que apareciera un campo nuevo.
 *
 * Este archivo declara **qué se puede configurar**, no cómo se dibuja. El
 * framework de tablas traduce esta configuración a sus propias
 * `ColumnDefinition`; ese es el único punto donde las dos cosas se tocan, igual
 * que `column-adapter` es el único punto donde el framework habla con TanStack.
 */

import { z } from 'zod';

/**
 * Tipo de dato de una columna.
 *
 * Existe porque los proveedores no tipan sus valores: RedsisOne entrega **todo
 * como texto**, incluidas fechas (`'2026-07-24T00:17:13.000Z'`) y números
 * (`'154'`). Sin declarar el tipo no se puede ordenar una fecha cronológicamente
 * ni alinear un número a la derecha, y la tabla trataría `'154'` como texto.
 *
 * Los comportamientos avanzados de `select`, `user`, `location` y `currency` están
 * **declarados y sin implementar**: hoy se representan como texto. Se declaran
 * ahora para que activarlos no cambie la forma de una columna guardada.
 */
export const TICKET_COLUMN_DATA_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  /** Fecha y hora. Nunca existe un tipo "solo fecha" (ver STACK.md). */
  DATE_TIME: 'dateTime',
  /** Valor de un catálogo cerrado que se pinta como distintivo. */
  STATUS: 'status',
  SELECT: 'select',
  USER: 'user',
  LOCATION: 'location',
  CURRENCY: 'currency',
} as const;

export type TicketColumnDataType =
  (typeof TICKET_COLUMN_DATA_TYPES)[keyof typeof TICKET_COLUMN_DATA_TYPES];

export const TICKET_COLUMN_DATA_TYPE_LABELS: Record<TicketColumnDataType, string> = {
  text: 'Texto',
  number: 'Número',
  boolean: 'Sí / No',
  dateTime: 'Fecha y hora',
  status: 'Estado',
  select: 'Lista de opciones',
  user: 'Usuario',
  location: 'Ubicación',
  currency: 'Importe',
};

/** Tipos cuyo comportamiento propio ya existe. El resto se representa como texto. */
export const IMPLEMENTED_COLUMN_DATA_TYPES: readonly TicketColumnDataType[] = [
  TICKET_COLUMN_DATA_TYPES.TEXT,
  TICKET_COLUMN_DATA_TYPES.NUMBER,
  TICKET_COLUMN_DATA_TYPES.BOOLEAN,
  TICKET_COLUMN_DATA_TYPES.DATE_TIME,
  TICKET_COLUMN_DATA_TYPES.STATUS,
];

/**
 * De dónde sale el valor **dentro de nuestro modelo**.
 *
 * No dice nada del proveedor a propósito: un campo estándar es un campo de
 * `Ticket` y una columna adicional es una clave de su `metadata`. Qué campo del
 * origen alimenta cada uno es cosa del backend y el frontend no lo necesita para
 * dibujar (ver `TicketColumnMapping`).
 */
export const TICKET_COLUMN_BINDINGS = {
  /** Un campo declarado en el contrato `Ticket`. */
  STANDARD: 'standard',
  /** Una clave del `metadata` del ticket. */
  METADATA: 'metadata',
} as const;

export type TicketColumnBinding =
  (typeof TICKET_COLUMN_BINDINGS)[keyof typeof TICKET_COLUMN_BINDINGS];

/**
 * Una columna tal como la recibe el frontend.
 *
 * Está **normalizada**: no contiene identificadores del proveedor, ni URLs, ni
 * nada que revele de dónde salen los datos. Es exactamente lo que hace falta para
 * pintar una columna y ni un campo más.
 */
export interface TicketColumnConfig {
  /**
   * Identificador estable. Es la clave con la que se guardan la visibilidad, el
   * ancho y las vistas del usuario, así que **no puede cambiar** aunque cambie el
   * nombre visible: renombrar una columna dejaría las vistas guardadas apuntando
   * a algo que ya no existe.
   */
  id: string;

  /** Nombre visible, configurable. Es lo que el usuario lee en la cabecera. */
  label: string;

  binding: TicketColumnBinding;

  /**
   * Campo de `Ticket` cuando el binding es estándar, o clave de `metadata` cuando
   * es adicional.
   */
  key: string;

  type: TicketColumnDataType;

  /** Si arranca visible. El usuario puede cambiarlo después desde la tabla. */
  isVisible: boolean;

  /** Posición dentro de la tabla, de menor a mayor. */
  order: number;

  /**
   * Una columna obligatoria no se puede ocultar ni retirar de la configuración.
   * El número del ticket lo es: identifica el servicio durante toda su vida.
   */
  isRequired: boolean;

  /** Permite agrupar por ella. Solo tiene sentido con pocos valores repetidos. */
  isGroupable: boolean;
}

/**
 * Cómo se alimenta una columna desde el origen. **Solo existe en el backend.**
 *
 * Se separa de `TicketColumnConfig` porque `providerFieldId` es vocabulario del
 * proveedor —el UUID de columna de RedsisOne, el nombre de campo de Baserow— y
 * §4 del MVP prohíbe que React conozca esa estructura. El Provider traduce con
 * este mapa y entrega al frontend solo la mitad de arriba.
 */
export interface TicketColumnMapping extends TicketColumnConfig {
  /**
   * Identificador del campo en el origen. Nulo cuando el valor no viene del
   * proveedor sino que lo calcula o lo rellena la plataforma.
   */
  providerFieldId: string | null;
}

/**
 * Columnas estándar de Tickets.
 *
 * Son las que corresponden a campos del contrato `Ticket` y existen en cualquier
 * proyecto. Sus identificadores son los que ya usaban las columnas del módulo, y
 * eso no es casualidad: cambiarlos invalidaría las vistas guardadas y los anchos
 * que cada usuario tiene en su navegador.
 */
export const STANDARD_TICKET_COLUMNS: readonly TicketColumnConfig[] = [
  {
    id: 'number',
    label: 'Ticket',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'number',
    type: TICKET_COLUMN_DATA_TYPES.TEXT,
    isVisible: true,
    order: 1,
    isRequired: true,
    isGroupable: false,
  },
  {
    id: 'status',
    label: 'Estado',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'status',
    type: TICKET_COLUMN_DATA_TYPES.STATUS,
    isVisible: true,
    order: 2,
    isRequired: false,
    isGroupable: true,
  },
  {
    id: 'priority',
    label: 'Prioridad',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'priority',
    type: TICKET_COLUMN_DATA_TYPES.STATUS,
    isVisible: true,
    order: 3,
    isRequired: false,
    isGroupable: true,
  },
  {
    id: 'clientName',
    label: 'Cliente',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'clientName',
    type: TICKET_COLUMN_DATA_TYPES.TEXT,
    isVisible: true,
    order: 4,
    isRequired: false,
    isGroupable: true,
  },
  {
    id: 'branchName',
    label: 'Sucursal',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'branchName',
    type: TICKET_COLUMN_DATA_TYPES.TEXT,
    isVisible: true,
    order: 5,
    isRequired: false,
    isGroupable: false,
  },
  {
    id: 'zoneName',
    label: 'Zona',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'zoneName',
    type: TICKET_COLUMN_DATA_TYPES.TEXT,
    isVisible: false,
    order: 6,
    isRequired: false,
    isGroupable: true,
  },
  {
    id: 'technicianName',
    label: 'Técnico',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'technicianName',
    type: TICKET_COLUMN_DATA_TYPES.USER,
    isVisible: true,
    order: 7,
    isRequired: false,
    isGroupable: true,
  },
  {
    id: 'city',
    label: 'Ciudad',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'city',
    type: TICKET_COLUMN_DATA_TYPES.TEXT,
    isVisible: true,
    order: 8,
    isRequired: false,
    isGroupable: true,
  },
  {
    id: 'createdAt',
    label: 'Creación',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'createdAt',
    type: TICKET_COLUMN_DATA_TYPES.DATE_TIME,
    isVisible: true,
    order: 9,
    isRequired: false,
    isGroupable: false,
  },
  {
    id: 'updatedAt',
    label: 'Última actualización',
    binding: TICKET_COLUMN_BINDINGS.STANDARD,
    key: 'updatedAt',
    type: TICKET_COLUMN_DATA_TYPES.DATE_TIME,
    // Dato de seguimiento, útil pero secundario: no satura la vista inicial.
    isVisible: false,
    order: 10,
    isRequired: false,
    isGroupable: false,
  },
];

/**
 * Cuántas columnas adicionales admite un proyecto.
 *
 * El número es un límite de configuración, **no una cantidad de campos**: no
 * existen veinte columnas esperando en el modelo. Un proyecto que use tres tiene
 * tres, y el ticket lleva tres claves en su `metadata`. Materializarlas como
 * campos fijos sería justo la tabla universal rígida que el MVP prohíbe.
 */
export const CUSTOM_COLUMN_SLOT_COUNT = 20;

/**
 * Identificadores de los espacios disponibles para columnas adicionales.
 *
 * Son identificadores, no nombres: `ColumnaAgrega1` puede llamarse "Fecha
 * compromiso" y `ColumnaAgrega2` "Tipo de servicio". La tabla muestra el nombre
 * configurado y guarda las preferencias contra el identificador, que es lo que
 * permite renombrar una columna sin que nadie pierda su vista guardada.
 */
export const CUSTOM_COLUMN_SLOTS: readonly string[] = Array.from(
  { length: CUSTOM_COLUMN_SLOT_COUNT },
  (_, index) => `ColumnaAgrega${index + 1}`,
);

export function isCustomColumnSlot(id: string): boolean {
  return CUSTOM_COLUMN_SLOTS.includes(id);
}

/**
 * Estructura de columnas de un proyecto.
 *
 * Es lo que el frontend pide para saber qué tabla dibujar. Llega ya resuelta: las
 * estándar que el proyecto conserve más las adicionales que haya configurado, en
 * su orden y con sus nombres.
 */
export interface TicketColumnLayout {
  /** Fuente de datos a la que pertenece esta estructura. */
  dataSourceId: string;
  columns: TicketColumnConfig[];
}

export const ticketColumnConfigSchema = z.object({
  id: z.string().trim().min(1, 'La columna necesita un identificador'),
  label: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre visible de la columna')
    .max(60, 'El nombre no puede pasar de 60 caracteres'),
  binding: z.enum([TICKET_COLUMN_BINDINGS.STANDARD, TICKET_COLUMN_BINDINGS.METADATA]),
  key: z.string().trim().min(1),
  type: z.enum(
    Object.values(TICKET_COLUMN_DATA_TYPES) as [TicketColumnDataType, ...TicketColumnDataType[]],
  ),
  isVisible: z.boolean(),
  order: z.number().int().min(0),
  isRequired: z.boolean(),
  isGroupable: z.boolean(),
});

/**
 * Estructura de columnas propuesta para un proyecto.
 *
 * Se validan las tres invariantes que corrompen la tabla en silencio si fallan:
 * identificadores repetidos (dos columnas escribiendo en la misma preferencia),
 * columnas obligatorias ausentes y más columnas adicionales de las que caben.
 */
export const ticketColumnLayoutSchema = z
  .object({
    columns: z.array(ticketColumnConfigSchema).min(1, 'La tabla necesita al menos una columna'),
  })
  .superRefine(({ columns }, context) => {
    const seen = new Set<string>();

    for (const column of columns) {
      if (seen.has(column.id)) {
        context.addIssue({
          code: 'custom',
          message: `Hay dos columnas con el identificador ${column.id}`,
          path: ['columns'],
        });
      }

      seen.add(column.id);
    }

    for (const required of STANDARD_TICKET_COLUMNS.filter((column) => column.isRequired)) {
      if (!seen.has(required.id)) {
        context.addIssue({
          code: 'custom',
          message: `La columna ${required.label} no se puede retirar`,
          path: ['columns'],
        });
      }
    }

    const customCount = columns.filter(
      (column) => column.binding === TICKET_COLUMN_BINDINGS.METADATA,
    ).length;

    if (customCount > CUSTOM_COLUMN_SLOT_COUNT) {
      context.addIssue({
        code: 'custom',
        message: `No caben más de ${CUSTOM_COLUMN_SLOT_COUNT} columnas adicionales`,
        path: ['columns'],
      });
    }
  });

export type TicketColumnLayoutInput = z.infer<typeof ticketColumnLayoutSchema>;
