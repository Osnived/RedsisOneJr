import type { Ticket } from '@redsis/contracts';
import { MOCK_TICKETS } from './mocks/tickets.mock';

/**
 * Servicio de datos de Tickets.
 *
 * Hoy devuelve datos en memoria, pero lo hace de forma asíncrona y detrás de la
 * misma firma que tendrá cuando exista el origen real. Eso permite que la
 * pantalla ejercite los estados de carga y error desde ahora.
 *
 * Cuando llegue la integración, el interior de esta función pasa a llamar a la
 * API (`apiClient.get('/tickets')`) y el backend resuelve con
 * Repository + Provider sobre Baserow. Ni la pantalla ni el DataTable cambian.
 */

/** Retardo artificial para poder ver el estado de carga. Desaparece con el origen real. */
const MOCK_LATENCY_MS = 400;

/**
 * Permite forzar un fallo desde la interfaz para comprobar el estado de error.
 * Es una herramienta de desarrollo, no una funcionalidad del negocio.
 */
export class TicketsUnavailableError extends Error {
  constructor() {
    super('No se pudo consultar los tickets. Intenta de nuevo.');
    this.name = 'TicketsUnavailableError';
  }
}

export const ticketsApi = {
  list: (options: { shouldFail?: boolean } = {}): Promise<Ticket[]> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (options.shouldFail) {
          reject(new TicketsUnavailableError());
          return;
        }

        resolve(MOCK_TICKETS);
      }, MOCK_LATENCY_MS);
    }),
};
