import { useCallback, useState } from 'react';
import {
  TABLE_PREFERENCES_VERSION,
  type StoredTablePreferences,
  type TablePreferences,
} from '@/types/table';

const STORAGE_PREFIX = 'redsis.table';

export function tablePreferencesKey(tableId: string): string {
  return `${STORAGE_PREFIX}.${tableId}`;
}

interface UseTablePreferencesResult {
  preferences: TablePreferences;
  /** Aplica un cambio parcial y lo persiste. */
  update: (changes: Partial<TablePreferences>) => void;
  /** Vuelve a los valores iniciales de la tabla y borra lo almacenado. */
  reset: () => void;
}

/**
 * Persiste las preferencias de una tabla por usuario y por tabla.
 *
 * Se guarda en `localStorage`: es inmediato, no requiere backend y es el sitio
 * natural de una preferencia de presentación. Cuando exista el módulo de
 * Configuración, sustituir el almacenamiento afecta solo a este archivo.
 *
 * Cualquier dato corrupto o de una versión anterior se descarta en silencio:
 * una preferencia ilegible nunca debe impedir que la tabla se muestre.
 */
export function useTablePreferences(
  tableId: string,
  defaults: TablePreferences,
): UseTablePreferencesResult {
  const [preferences, setPreferences] = useState<TablePreferences>(() =>
    readPreferences(tableId, defaults),
  );
  const [loadedTableId, setLoadedTableId] = useState(tableId);

  // Cambiar de tabla dentro de la misma pantalla debe traer sus propias
  // preferencias, no arrastrar las de la tabla anterior. El ajuste se hace
  // durante el render, no en un efecto: React descarta el render en curso y
  // vuelve a renderizar sin pintar el estado intermedio.
  if (loadedTableId !== tableId) {
    setLoadedTableId(tableId);
    setPreferences(readPreferences(tableId, defaults));
  }

  const update = useCallback(
    (changes: Partial<TablePreferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...changes };
        writePreferences(tableId, next);
        return next;
      });
    },
    [tableId],
  );

  // `defaults` se deriva de las columnas y quien llama al hook las memoiza,
  // así que su identidad es estable y puede ser una dependencia normal.
  const reset = useCallback(() => {
    clearPreferences(tableId);
    setPreferences(defaults);
  }, [tableId, defaults]);

  return { preferences, update, reset };
}

function readPreferences(tableId: string, defaults: TablePreferences): TablePreferences {
  const raw = safeGetItem(tablePreferencesKey(tableId));

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isStoredPreferences(parsed) || parsed.version !== TABLE_PREFERENCES_VERSION) {
      return defaults;
    }

    // Se mezcla con los valores iniciales para que una columna nueva aparezca
    // aunque el usuario tenga preferencias guardadas de antes.
    return {
      columnVisibility: { ...defaults.columnVisibility, ...parsed.preferences.columnVisibility },
      columnSizing: { ...defaults.columnSizing, ...parsed.preferences.columnSizing },
      pageSize: parsed.preferences.pageSize,
      sorting: parsed.preferences.sorting,
    };
  } catch {
    return defaults;
  }
}

function writePreferences(tableId: string, preferences: TablePreferences): void {
  const payload: StoredTablePreferences = {
    version: TABLE_PREFERENCES_VERSION,
    preferences,
  };

  safeSetItem(tablePreferencesKey(tableId), JSON.stringify(payload));
}

function clearPreferences(tableId: string): void {
  try {
    localStorage.removeItem(tablePreferencesKey(tableId));
  } catch {
    // Sin almacenamiento disponible no hay nada que limpiar.
  }
}

/**
 * El almacenamiento puede estar deshabilitado o lleno. En ese caso la tabla
 * sigue funcionando, simplemente sin recordar los ajustes.
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Se descarta: perder una preferencia es preferible a romper la pantalla.
  }
}

function isStoredPreferences(value: unknown): value is StoredTablePreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredTablePreferences>;

  if (typeof candidate.version !== 'number' || typeof candidate.preferences !== 'object') {
    return false;
  }

  const preferences = candidate.preferences as Partial<TablePreferences> | null;

  return (
    preferences !== null &&
    typeof preferences.pageSize === 'number' &&
    Array.isArray(preferences.sorting) &&
    typeof preferences.columnVisibility === 'object' &&
    preferences.columnVisibility !== null &&
    typeof preferences.columnSizing === 'object' &&
    preferences.columnSizing !== null
  );
}
