import { useNavigate } from '@tanstack/react-router';
import type { Ticket } from '@redsis/contracts';

/**
 * Lleva a la pantalla de un ticket.
 *
 * Desde este release el ticket es el centro del sistema: la tabla y las tarjetas
 * solo sirven para encontrarlo y toda la operación ocurre en su pantalla. Quien
 * quiera abrir un ticket —hoy las dos vistas, mañana un aviso o el panel— pide
 * este callback en lugar de construir la URL por su cuenta.
 *
 * Existe como hook y no como constante porque navegar necesita el enrutador. Al
 * concentrarlo aquí, la forma de la URL del detalle se cambia en un solo archivo
 * y ninguna pantalla la conoce.
 */
export function useOpenTicket(): (ticket: Ticket) => void {
  const navigate = useNavigate();

  return (ticket) => {
    void navigate({ to: '/tickets/$ticketId', params: { ticketId: ticket.id } });
  };
}
