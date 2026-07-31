import type { ReactNode } from 'react';
import type { DataTableProps } from './data-table';

/**
 * Capacidades avanzadas del AdvancedTable.
 *
 * Se declaran todas desde el principio para que la API pública no cambie cuando
 * cada una se implemente: activar una capacidad futura será poner su bandera en
 * true, no modificar el contrato ni las pantallas que ya lo usan.
 *
 * `AdvancedTable` avisa por consola si se habilita una que aún no existe, en
 * lugar de fallar en silencio.
 */
export interface AdvancedTableCapabilities {
  /** Vistas guardadas por el usuario: columnas, filtros, orden y paginación. */
  views: boolean;

  /** Agrupar filas por el valor de una columna. */
  grouping: boolean;

  /** Panel lateral de configuración de columnas. */
  columnSettings: boolean;

  /** Constructor visual de condiciones sobre las columnas. */
  filters: boolean;

  /** Exportar el resultado actual. */
  exports: boolean;

  /** Representaciones alternativas del mismo origen de datos. */
  kanban: boolean;
  timeline: boolean;
  maps: boolean;
}

/** Ninguna capacidad avanzada activa. Es el punto de partida de toda tabla. */
export const NO_ADVANCED_CAPABILITIES: AdvancedTableCapabilities = {
  views: false,
  grouping: false,
  columnSettings: false,
  filters: false,
  exports: false,
  kanban: false,
  timeline: false,
  maps: false,
};

export type AdvancedCapability = keyof AdvancedTableCapabilities;

/**
 * Capacidades ya implementadas.
 *
 * Se mantiene explícita para que habilitar una sin implementarla se detecte de
 * inmediato. Al implementar una capacidad se mueve aquí y se borra su aviso.
 */
export const IMPLEMENTED_CAPABILITIES: readonly AdvancedCapability[] = [
  'columnSettings',
  'views',
  'grouping',
  'filters',
];

/**
 * API pública del AdvancedTable.
 *
 * Extiende la del DataTable sin sustituirla: todo lo que funciona en una tabla
 * administrativa funciona igual aquí. Lo único que añade son las capacidades
 * avanzadas y los puntos donde se insertan.
 */
export interface AdvancedTableProps<TData> extends DataTableProps<TData> {
  /** Capacidades a habilitar. Por defecto ninguna. */
  capabilities?: Partial<AdvancedTableCapabilities>;

  /**
   * Contenido de la barra de vistas, cuando `views` esté implementado.
   * Se declara ya para que la estructura del componente no cambie después.
   */
  viewsBar?: ReactNode;

  /**
   * Panel lateral adicional del módulo, junto al de configuración de columnas.
   *
   * Se renderiza dentro del contexto de la tabla, así que puede leer y modificar
   * su estado con los hooks del framework sin recibir nada por propiedades.
   */
  sidePanel?: ReactNode;
}
