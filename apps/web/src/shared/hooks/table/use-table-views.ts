import { useCallback, useState } from 'react';
import { createId } from '@/shared/lib/create-id';
import { localTableViewsStorage } from '@/shared/lib/table/views-storage';
import type { TablePreferences, TableView, TableViewState } from '@/shared/types/table';
import { useTableContext } from './use-table-context';

interface UseTableViewsResult {
  views: TableView[];
  /** Vista aplicada, si hay alguna. */
  activeViewId: string | null;
  /** Guarda el estado actual de la tabla como una vista nueva y la activa. */
  create: (name: string) => void;
  /** Devuelve la tabla al estado que guardó la vista. */
  apply: (viewId: string) => void;
  remove: (viewId: string) => void;
}

/**
 * Vistas guardadas de una tabla.
 *
 * El hook es el único punto que conoce el almacén. Migrar las vistas a
 * PostgreSQL significa cambiar de dónde salen aquí dentro; ni la barra de
 * vistas ni las pantallas se enteran.
 *
 * Se mantiene una copia en estado en lugar de releer el almacén en cada render
 * porque leer y parsear en cada pintado es trabajo desperdiciado, y el usuario
 * es el único que puede cambiar sus propias vistas.
 */
export function useTableViews(): UseTableViewsResult {
  const { tableId, preferences, updatePreferences } = useTableContext<unknown>();
  const [views, setViews] = useState<TableView[]>(() => localTableViewsStorage.list(tableId));
  const [loadedTableId, setLoadedTableId] = useState(tableId);

  // Cambiar de tabla dentro de la misma pantalla debe traer sus propias vistas.
  // El ajuste se hace durante el render y no en un efecto: React descarta el
  // render en curso y vuelve a renderizar sin pintar el estado intermedio.
  if (loadedTableId !== tableId) {
    setLoadedTableId(tableId);
    setViews(localTableViewsStorage.list(tableId));
  }

  const persist = useCallback(
    (next: TableView[]) => {
      localTableViewsStorage.save(tableId, next);
      setViews(next);
    },
    [tableId],
  );

  const create = useCallback(
    (name: string) => {
      const view: TableView = {
        id: createId(),
        name: name.trim(),
        state: snapshot(preferences),
      };

      persist([...views, view]);
      updatePreferences({ activeViewId: view.id });
    },
    [persist, preferences, updatePreferences, views],
  );

  const apply = useCallback(
    (viewId: string) => {
      const view = views.find((candidate) => candidate.id === viewId);

      if (!view) {
        return;
      }

      // Un estado nuevo invalida la página actual: la fila que el usuario
      // miraba ya no tiene por qué estar ahí.
      updatePreferences({ ...view.state, page: 1, activeViewId: view.id });
    },
    [updatePreferences, views],
  );

  const remove = useCallback(
    (viewId: string) => {
      persist(views.filter((view) => view.id !== viewId));

      // Borrar la vista aplicada deja la tabla como está, pero ya no hay nada
      // que señalar como activo.
      if (preferences.activeViewId === viewId) {
        updatePreferences({ activeViewId: null });
      }
    },
    [persist, preferences.activeViewId, updatePreferences, views],
  );

  return {
    views,
    activeViewId: preferences.activeViewId,
    create,
    apply,
    remove,
  };
}

/** Extrae de las preferencias solo lo que define una vista. */
function snapshot(preferences: TablePreferences): TableViewState {
  return {
    columnVisibility: { ...preferences.columnVisibility },
    filters: [...preferences.filters],
    sorting: [...preferences.sorting],
    pageSize: preferences.pageSize,
  };
}
