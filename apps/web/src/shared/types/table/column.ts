import type { ReactNode } from 'react';

export type ColumnAlignment = 'left' | 'center' | 'right';

/**
 * Definición de una columna del framework de tablas.
 *
 * Es intencionadamente independiente de TanStack Table: los módulos que
 * consuman el framework (Tickets, Usuarios, Inventario, Activos...) describen
 * qué quieren mostrar, no cómo funciona el motor. Eso permite sustituir el
 * motor sin tocar las nueve pantallas que lo usarán.
 */
export interface ColumnDefinition<TData> {
  /** Identificador estable. Se usa como clave de las preferencias del usuario. */
  id: string;

  /** Texto de la cabecera. */
  header: string;

  /** Extrae el valor de la fila. Se usa para ordenar y para buscar. */
  accessor: (row: TData) => unknown;

  /** Render personalizado de la celda. Si se omite, se muestra el valor formateado. */
  cell?: (row: TData) => ReactNode;

  /** Por defecto true. */
  sortable?: boolean;

  /** Por defecto true. Una columna no ocultable siempre permanece visible. */
  hideable?: boolean;

  /** Por defecto true. */
  resizable?: boolean;

  /** Ancho inicial en píxeles. */
  width?: number;

  /** Ancho mínimo al redimensionar. */
  minWidth?: number;

  /** Alineación del contenido. Por defecto a la izquierda. */
  align?: ColumnAlignment;

  /**
   * Oculta la columna en la primera carga sin impedir que el usuario la active.
   * Útil para columnas secundarias que no deben saturar la vista inicial.
   */
  hiddenByDefault?: boolean;

  /**
   * Permite usar la columna como criterio de agrupación. Por defecto false.
   *
   * Es opt-in porque agrupar solo tiene sentido sobre campos con pocos valores
   * repetidos: agrupar por número de ticket daría un grupo por fila.
   */
  groupable?: boolean;

  /**
   * Permite declarar condiciones sobre la columna. Por defecto true.
   *
   * Se apaga en columnas que no contienen un dato sobre el que tenga sentido
   * preguntar.
   */
  filterable?: boolean;

  /**
   * Texto del grupo cuando se agrupa por esta columna.
   *
   * Hace falta cuando el accesor devuelve un código en lugar de algo legible:
   * el grupo debe decir "En ruta", no "en-ruta". Sin declararlo se muestra el
   * valor con el formato general del framework.
   */
  groupLabel?: (value: unknown) => string;
}

/**
 * Columna que el usuario puede mostrar u ocultar.
 *
 * Es la forma plana en la que el framework expone sus columnas a cualquier
 * control que las gobierne —el selector de la barra superior, el panel lateral
 * de configuración—. No menciona el motor de tablas a propósito: quien la
 * consume no debe poder llegar a él.
 */
export interface SelectableColumn {
  id: string;
  label: string;
  isVisible: boolean;
}

export const DEFAULT_COLUMN_WIDTH = 180;
export const MIN_COLUMN_WIDTH = 80;

/**
 * Identificadores reservados para las columnas que añade el framework.
 *
 * Llevan prefijo doble para que no colisionen con el id de una columna real
 * definida por un módulo.
 */
export const ROW_ACTIONS_COLUMN_ID = '__rowActions';
export const ROW_SELECTION_COLUMN_ID = '__rowSelection';
