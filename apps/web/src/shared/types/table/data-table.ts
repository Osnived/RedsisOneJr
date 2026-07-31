import type { ReactNode } from 'react';
import type { ColumnDefinition } from './column';
import type { TableMode, TableQuery } from './query';

/**
 * Navegación desde una fila.
 *
 * Existe para las tablas cuyo cometido es **localizar** un registro y no operar
 * sobre él: pulsar la fila lleva a su pantalla. Es lo contrario de `rowActions`,
 * que ejecuta acciones sin salir de la tabla; una tabla puede usar cualquiera de
 * las dos, y declarar ambas confundiría a quien la usa.
 *
 * Las dos funciones viajan juntas y no como propiedades independientes porque una
 * fila accionable necesita las dos: qué hacer al pulsarla y cómo se llama su
 * destino. Separadas, se podría declarar la primera sin la segunda y la fila
 * quedaría accionable sin nombre para quien no ve la pantalla.
 */
export interface RowNavigation<TData> {
  /** Se invoca al pulsar la fila, con ratón o con el teclado. */
  onSelect: (row: TData) => void;

  /**
   * Nombre accesible de la fila, por ejemplo `Abrir el ticket INC-2026-000101`.
   *
   * El contenido de las celdas no sirve: describe el registro, no a dónde lleva
   * pulsarlo.
   */
  label: (row: TData) => string;
}

/**
 * Propiedades que solo afectan a cómo se dibuja la tabla.
 *
 * Se separan de las del motor porque son las únicas que cambian cuando la misma
 * tabla se presenta de dos maneras distintas. `DataTable` y `AdvancedTable`
 * comparten el motor y difieren solo en esta mitad.
 */
export interface DataTablePresentationProps {
  loading?: boolean;

  /**
   * Error a mostrar en lugar de las filas.
   *
   * Se recibe el `Error` completo, no un texto, para que el módulo pueda pasar
   * directamente lo que le devuelve su capa de datos sin traducirlo.
   */
  error?: Error | null;

  /**
   * Contenido propio del módulo en la barra superior: botón de alta,
   * exportación, filtros específicos.
   *
   * Es un nodo porque el framework no puede ni debe saber qué controles necesita
   * cada pantalla.
   */
  toolbar?: ReactNode;

  emptyMessage?: string;

  /** Por defecto true. */
  enableSearch?: boolean;

  searchPlaceholder?: string;
}

/**
 * API pública del DataTable.
 *
 * Es el único contrato que necesita conocer un módulo de la plataforma. Todo lo
 * que hace falta para mostrar una tabla se expresa aquí; nada del motor interno
 * queda expuesto.
 *
 * Salvo `data` y las columnas, ninguna propiedad es específica de un dominio:
 * el mismo componente sirve para Tickets, Usuarios, Clientes, Inventario,
 * Equipos, Activos, Sucursales, Técnicos y Proyectos sin modificarse.
 */
export interface DataTableProps<TData> extends DataTablePresentationProps {
  /**
   * Identificador único de la tabla dentro de la plataforma.
   *
   * Obligatorio: determina dónde se guardan las preferencias del usuario. Dos
   * tablas distintas nunca deben compartirlo.
   */
  tableId: string;

  /**
   * Definición de las columnas.
   *
   * Debe declararse fuera del componente o memoizarse con `useMemo`: si su
   * identidad cambia en cada render, el motor reconstruye las columnas y pierde
   * el estado interno de la tabla.
   */
  columns: ColumnDefinition<TData>[];

  data: TData[];

  /** Clave estable de cada fila. Evita que React reordene filas al actualizar. */
  getRowId: (row: TData) => string;

  /**
   * Acciones por fila (ver, editar, asignar...).
   *
   * Es una función y no un nodo porque las acciones necesitan saber sobre qué
   * fila actúan. Se renderiza en una columna fija al final, no ocultable.
   */
  rowActions?: (row: TData) => ReactNode;

  /**
   * Convierte cada fila en el acceso a la pantalla del registro.
   *
   * Un clic sobre un control dentro de la fila —la casilla de selección, un menú
   * de acciones— no navega: el framework lo distingue por sí solo, así que ningún
   * módulo tiene que detener la propagación en sus celdas.
   */
  rowNavigation?: RowNavigation<TData>;

  /**
   * Habilita la selección de filas con casillas de verificación.
   *
   * La selección es transitoria y no se guarda en preferencias: restaurar filas
   * marcadas de una sesión anterior, cuando los datos ya cambiaron, sería
   * engañoso.
   */
  enableRowSelection?: boolean;

  /** Se invoca con las filas seleccionadas cada vez que la selección cambia. */
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  /** Por defecto `client`. */
  mode?: TableMode;

  /** Obligatorio en modo servidor: total de registros existentes. */
  totalRows?: number;

  /** En modo servidor se invoca cuando cambia el orden, la página o la búsqueda. */
  onQueryChange?: (query: TableQuery) => void;
}

/**
 * Propiedades de la tabla ya montada dentro de un `TableProvider`.
 *
 * No es parte de la API pública de la plataforma: la usan `DataTable` y
 * `AdvancedTable` para dibujar la misma tabla sobre un motor compartido.
 */
export interface DataTableViewProps extends DataTablePresentationProps {
  /**
   * Sustituye el selector de columnas de la barra superior.
   *
   * Sin esto, la tabla avanzada tendría dos controles distintos haciendo lo
   * mismo: el desplegable propio del BaseTable y el que abre el panel lateral.
   */
  columnControls?: ReactNode;

  /**
   * Controles que añade la tabla avanzada a la barra superior: agrupación,
   * filtros. Van en una sola ranura para que cada capacidad nueva no obligue a
   * ampliar este contrato.
   */
  advancedControls?: ReactNode;
}
