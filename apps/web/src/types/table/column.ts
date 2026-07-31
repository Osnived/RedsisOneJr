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
