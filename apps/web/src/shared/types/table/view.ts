import type { AdvancedFilter } from './filter';
import type { TableSort } from './query';

/**
 * Lo que una vista conserva de la tabla.
 *
 * Deliberadamente no guarda la página ni la búsqueda: una vista describe *cómo*
 * se mira un módulo, no dónde se quedó el usuario la última vez. Eso último ya
 * lo recuerdan las preferencias.
 */
export interface TableViewState {
  columnVisibility: Record<string, boolean>;
  filters: AdvancedFilter[];
  sorting: TableSort[];
  pageSize: number;
}

export interface TableView {
  id: string;
  name: string;
  state: TableViewState;
}

/**
 * Versión del formato almacenado.
 *
 * Si cambia la forma de una vista, este número se incrementa y las vistas
 * antiguas se descartan en lugar de provocar errores al leerlas.
 */
export const TABLE_VIEWS_VERSION = 1;

export interface StoredTableViews {
  version: number;
  views: TableView[];
}
