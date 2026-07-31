import { TABLE_VIEWS_VERSION, type StoredTableViews, type TableView } from '@/shared/types/table';

const STORAGE_PREFIX = 'redsis.views';

export function tableViewsKey(tableId: string): string {
  return `${STORAGE_PREFIX}.${tableId}`;
}

/**
 * Almacén de vistas de una tabla.
 *
 * Hoy resuelve contra `localStorage`. Cuando las vistas se guarden en
 * PostgreSQL, se sustituye esta implementación por otra que hable con la API:
 * el hook que la consume y los componentes que la usan no cambian, porque
 * ninguno sabe de dónde salen las vistas.
 *
 * Es el mismo reparto que ya usan las preferencias de tabla, y por la misma
 * razón: el origen de los datos nunca debe llegar a la interfaz.
 */
export interface TableViewsStorage {
  list: (tableId: string) => TableView[];
  save: (tableId: string, views: TableView[]) => void;
}

export const localTableViewsStorage: TableViewsStorage = {
  list: readViews,
  save: writeViews,
};

/**
 * Cualquier dato corrupto o de una versión anterior se descarta en silencio:
 * una vista ilegible nunca debe impedir que la tabla se muestre.
 */
function readViews(tableId: string): TableView[] {
  const raw = safeGetItem(tableViewsKey(tableId));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isStoredViews(parsed) || parsed.version !== TABLE_VIEWS_VERSION) {
      return [];
    }

    return parsed.views.filter(isTableView);
  } catch {
    return [];
  }
}

function writeViews(tableId: string, views: TableView[]): void {
  const payload: StoredTableViews = { version: TABLE_VIEWS_VERSION, views };

  try {
    localStorage.setItem(tableViewsKey(tableId), JSON.stringify(payload));
  } catch {
    // Se descarta: perder una vista es preferible a romper la pantalla.
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isStoredViews(value: unknown): value is StoredTableViews {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredTableViews>;

  return typeof candidate.version === 'number' && Array.isArray(candidate.views);
}

function isTableView(value: unknown): value is TableView {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<TableView>;

  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
    return false;
  }

  const state = candidate.state;

  return (
    typeof state === 'object' &&
    state !== null &&
    typeof state.pageSize === 'number' &&
    Array.isArray(state.sorting) &&
    Array.isArray(state.filters) &&
    typeof state.columnVisibility === 'object' &&
    state.columnVisibility !== null
  );
}
