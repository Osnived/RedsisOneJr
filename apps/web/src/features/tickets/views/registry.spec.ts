/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { IMPLEMENTED_VIEW_KINDS, type ViewKind } from '@/shared/lib/view-mode';
import { TICKET_VIEWS, resolveTicketView } from './registry';
import { TicketCardView } from './ticket-card-view';
import { TicketTableView } from './ticket-table-view';

/** Las que están declaradas pero todavía no existen. */
const PENDING_KINDS: ViewKind[] = ['kanban', 'calendar', 'timeline', 'map'];

describe('registro de vistas de Tickets', () => {
  it('resuelve la tabla', () => {
    expect(resolveTicketView('table')).toBe(TicketTableView);
  });

  it('resuelve las tarjetas', () => {
    expect(resolveTicketView('cards')).toBe(TicketCardView);
  });

  it('registra exactamente las vistas ya implementadas', () => {
    expect(Object.keys(TICKET_VIEWS).sort()).toEqual([...IMPLEMENTED_VIEW_KINDS].sort());
  });

  describe('vistas preparadas pero pendientes', () => {
    it('están declaradas sin estar registradas', () => {
      for (const kind of PENDING_KINDS) {
        expect(TICKET_VIEWS[kind]).toBeUndefined();
      }
    });

    it('caen a la tabla en lugar de dejar la pantalla vacía', () => {
      for (const kind of PENDING_KINDS) {
        expect(resolveTicketView(kind)).toBe(TicketTableView);
      }
    });
  });
});
