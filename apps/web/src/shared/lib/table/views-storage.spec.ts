import { describe, expect, it } from 'vitest';
import { TABLE_VIEWS_VERSION, type TableView } from '@/shared/types/table';
import { createId } from '../create-id';
import { localTableViewsStorage, tableViewsKey } from './views-storage';

const VIEW: TableView = {
  id: 'v1',
  name: 'Mis pendientes',
  state: { columnVisibility: { notes: false }, filters: [], sorting: [], pageSize: 25 },
};

function store(tableId: string, payload: unknown): void {
  localStorage.setItem(tableViewsKey(tableId), JSON.stringify(payload));
}

describe('localTableViewsStorage', () => {
  it('no devuelve nada cuando no hay vistas guardadas', () => {
    expect(localTableViewsStorage.list('tabla-a')).toEqual([]);
  });

  it('guarda y recupera una vista', () => {
    localTableViewsStorage.save('tabla-a', [VIEW]);

    expect(localTableViewsStorage.list('tabla-a')).toEqual([VIEW]);
  });

  it('mantiene separadas las vistas de tablas distintas', () => {
    localTableViewsStorage.save('tabla-a', [VIEW]);

    expect(localTableViewsStorage.list('tabla-b')).toEqual([]);
  });

  describe('datos almacenados no válidos', () => {
    it('ignora un JSON corrupto', () => {
      localStorage.setItem(tableViewsKey('tabla-a'), '{no es json');

      expect(localTableViewsStorage.list('tabla-a')).toEqual([]);
    });

    it('descarta una versión anterior del formato', () => {
      store('tabla-a', { version: TABLE_VIEWS_VERSION - 1, views: [VIEW] });

      expect(localTableViewsStorage.list('tabla-a')).toEqual([]);
    });

    it('descarta las vistas mal formadas y conserva las buenas', () => {
      store('tabla-a', {
        version: TABLE_VIEWS_VERSION,
        views: [VIEW, { id: 'roto' }, { name: 'sin estado', id: 'x' }],
      });

      // Una vista ilegible nunca debe arrastrar consigo a las demás.
      expect(localTableViewsStorage.list('tabla-a')).toEqual([VIEW]);
    });
  });
});

describe('createId', () => {
  it('no repite identificadores', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createId()));

    expect(ids.size).toBe(50);
  });
});
