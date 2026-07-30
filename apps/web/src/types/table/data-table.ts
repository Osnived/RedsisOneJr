import type { ReactNode } from 'react';
import type { ColumnDefinition } from './column';
import type { TableMode, TableQuery } from './query';

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
export interface DataTableProps<TData> {
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

  /**
   * Acciones por fila (ver, editar, asignar...).
   *
   * Es una función y no un nodo porque las acciones necesitan saber sobre qué
   * fila actúan. Se renderiza en una columna fija al final, no ocultable.
   */
  rowActions?: (row: TData) => ReactNode;

  /** Por defecto `client`. */
  mode?: TableMode;

  /** Obligatorio en modo servidor: total de registros existentes. */
  totalRows?: number;

  /** En modo servidor se invoca cuando cambia el orden, la página o la búsqueda. */
  onQueryChange?: (query: TableQuery) => void;

  emptyMessage?: string;

  /** Por defecto true. */
  enableSearch?: boolean;

  searchPlaceholder?: string;
}
