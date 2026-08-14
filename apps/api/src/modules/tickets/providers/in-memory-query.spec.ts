import { dataQuerySchema } from '@redsis/contracts';
import { applyQuery, valueOf } from './in-memory-query';
import { buildSeedTickets } from './mock-tickets.seed';

/**
 * Resolución de una consulta en memoria.
 *
 * Es lógica pura, así que se ejercita sin montar Nest ni tocar el proveedor.
 */
describe('applyQuery', () => {
  const tickets = buildSeedTickets();

  function query(overrides: Record<string, unknown> = {}) {
    return dataQuerySchema.parse(overrides);
  }

  describe('paginación', () => {
    it('devuelve la página pedida', () => {
      const first = applyQuery(tickets, query({ page: 1, pageSize: 5 }));
      const second = applyQuery(tickets, query({ page: 2, pageSize: 5 }));

      expect(first.items).toHaveLength(5);
      expect(second.items).toHaveLength(5);
      expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
    });

    it('el total cuenta los que cumplen la consulta, no los que caben en la página', () => {
      // De este número depende cuántas páginas dibuja la tabla.
      const result = applyQuery(tickets, query({ pageSize: 5 }));

      expect(result.total).toBe(tickets.length);
    });

    it('una página más allá del final queda vacía sin fallar', () => {
      const result = applyQuery(tickets, query({ page: 99, pageSize: 10 }));

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(tickets.length);
    });
  });

  describe('búsqueda general', () => {
    it('encuentra por un campo estándar sin saber cuál es', () => {
      const target = tickets[0];
      const result = applyQuery(tickets, query({ search: target?.number ?? '' }));

      expect(result.items.map((ticket) => ticket.id)).toContain(target?.id);
    });

    it('encuentra también por un dato adicional del proveedor', () => {
      // Quien busca no sabe si "EQ-1003" es una columna estándar o una añadida.
      const result = applyQuery(tickets, query({ search: 'EQ-1003' }));

      expect(result.total).toBeGreaterThan(0);
    });

    it('no distingue mayúsculas de minúsculas', () => {
      const upper = applyQuery(tickets, query({ search: 'BANCO' }));
      const lower = applyQuery(tickets, query({ search: 'banco' }));

      expect(upper.total).toBe(lower.total);
      expect(upper.total).toBeGreaterThan(0);
    });

    it('una búsqueda vacía no descarta nada', () => {
      expect(applyQuery(tickets, query({ search: '   ' })).total).toBe(tickets.length);
    });

    it('encuentra sin acertar la tilde', () => {
      // Quien busca está recordando el dato, no transcribiéndolo: obligarle a
      // acertar la tilde hace que la búsqueda parezca rota.
      const withAccent = applyQuery(tickets, query({ search: 'Clínica' }));
      const withoutAccent = applyQuery(tickets, query({ search: 'clinica' }));

      expect(withAccent.total).toBeGreaterThan(0);
      expect(withoutAccent.total).toBe(withAccent.total);
    });

    it('encuentra también escribiendo la tilde de más', () => {
      expect(applyQuery(tickets, query({ search: 'Bogotá' })).total).toBe(
        applyQuery(tickets, query({ search: 'bogota' })).total,
      );
    });
  });

  describe('filtros', () => {
    function filter(columnId: string, operator: string, value = '') {
      return query({ filters: [{ id: 'f1', columnId, operator, value }], pageSize: 100 });
    }

    it('compara sobre el dato almacenado y no sobre lo que se ve', () => {
      // El código es `en-ruta`; la etiqueta "En ruta" es presentación.
      const byCode = applyQuery(tickets, filter('status', 'es', 'en-ruta'));
      const byLabel = applyQuery(tickets, filter('status', 'es', 'En ruta'));

      expect(byCode.total).toBeGreaterThan(0);
      expect(byLabel.total).toBe(0);
    });

    it('excluye con "no es"', () => {
      const excluded = applyQuery(tickets, filter('status', 'noEs', 'en-ruta'));
      const included = applyQuery(tickets, filter('status', 'es', 'en-ruta'));

      expect(excluded.total + included.total).toBe(tickets.length);
    });

    it('reconoce vacío y no vacío sobre un dato ausente', () => {
      // Uno de cada cuatro tickets llega sin número de equipo a propósito.
      const empty = applyQuery(tickets, filter('ColumnaAgrega3', 'vacio'));
      const filled = applyQuery(tickets, filter('ColumnaAgrega3', 'noVacio'));

      expect(empty.total).toBeGreaterThan(0);
      expect(empty.total + filled.total).toBe(tickets.length);
    });

    it('empieza por y termina por operan sobre el texto del dato', () => {
      expect(applyQuery(tickets, filter('number', 'empiezaPor', 'INC-2026')).total).toBe(
        tickets.length,
      );
      expect(applyQuery(tickets, filter('number', 'terminaPor', 'zzz')).total).toBe(0);
    });

    it('una condición a medio escribir no vacía la tabla', () => {
      // Mientras se teclea, el operador ya está elegido y el valor todavía no.
      expect(applyQuery(tickets, filter('clientName', 'contiene', '  ')).total).toBe(
        tickets.length,
      );
    });

    it('las condiciones se combinan con Y', () => {
      const combined = applyQuery(
        tickets,
        query({
          pageSize: 100,
          filters: [
            { id: 'f1', columnId: 'status', operator: 'es', value: 'nuevo' },
            { id: 'f2', columnId: 'city', operator: 'es', value: 'Bogotá' },
          ],
        }),
      );

      for (const ticket of combined.items) {
        expect(ticket.status).toBe('nuevo');
        expect(ticket.city).toBe('Bogotá');
      }
    });
  });

  describe('ordenamiento', () => {
    it('ordena de forma ascendente y descendente', () => {
      const ascending = applyQuery(
        tickets,
        query({ sorting: [{ id: 'number', desc: false }], pageSize: 100 }),
      );
      const descending = applyQuery(
        tickets,
        query({ sorting: [{ id: 'number', desc: true }], pageSize: 100 }),
      );

      expect(ascending.items[0]?.number).toBe(descending.items.at(-1)?.number);
    });

    it('ordena también por un dato adicional del proveedor', () => {
      const result = applyQuery(
        tickets,
        query({ sorting: [{ id: 'ColumnaAgrega2', desc: false }], pageSize: 100 }),
      );

      expect(result.items).toHaveLength(tickets.length);
    });

    it('los valores ausentes van al final en orden ascendente', () => {
      // Lo que falta interesa menos que lo que existe, se ordene por lo que se
      // ordene.
      const result = applyQuery(
        tickets,
        query({ sorting: [{ id: 'ColumnaAgrega3', desc: false }], pageSize: 100 }),
      );

      const lastValues = result.items.slice(-1).map((ticket) => ticket.metadata.ColumnaAgrega3);

      expect(lastValues).toEqual([null]);
    });
  });
});

describe('valueOf', () => {
  const [ticket] = buildSeedTickets();

  it('resuelve un campo del contrato', () => {
    expect(valueOf(ticket, 'clientName')).toBe(ticket?.clientName);
  });

  it('resuelve un dato adicional por su identificador de columna', () => {
    expect(valueOf(ticket, 'ColumnaAgrega2')).toBe(ticket?.metadata.ColumnaAgrega2);
  });

  it('una columna que no existe no rompe la consulta', () => {
    expect(valueOf(ticket, 'columna-inventada')).toBeNull();
  });
});
