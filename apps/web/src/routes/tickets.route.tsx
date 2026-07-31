import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS, type Ticket } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { useViewMode } from '@/shared/hooks/use-view-mode';
import { TicketView } from '@/features/tickets/views';
import { useTickets } from '@/features/tickets/use-tickets';
import { Forbidden } from '@/shared/components/layout/forbidden';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { authenticatedRoute } from './authenticated.route';

export const ticketsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tickets',
  component: TicketsPage,
});

/**
 * Pantalla de Tickets.
 *
 * Consulta los datos una sola vez y decide cómo representarlos. Nada más: qué
 * vista corresponde lo resuelve `useViewMode`, y cómo se dibuja cada una es
 * asunto de la vista. La página no consulta el tamaño de la pantalla ni el rol.
 *
 * Los datos llegan por TanStack Query desde un servicio que hoy resuelve con
 * datos en memoria. Cuando se integre Baserow solo cambia el interior de ese
 * servicio: ni esta pantalla ni las vistas se modifican.
 */
function TicketsPage(): React.JSX.Element {
  const auth = useAuthorization();

  // Interruptor de desarrollo para poder ver el estado de error de la tabla.
  // Desaparece cuando exista el origen real.
  const [shouldFail, setShouldFail] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

  const ticketsQuery = useTickets({ shouldFail });
  const { mode, reason } = useViewMode();

  if (!auth.can(PERMISSIONS.TICKETS_VIEW)) {
    return <Forbidden detail="No tienes permiso para consultar tickets." />;
  }

  const tickets = ticketsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {ticketsQuery.isPending ? 'Consultando...' : `${tickets.length} incidentes registrados`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShouldFail((current) => !current)}>
            {shouldFail ? 'Restaurar origen' : 'Simular fallo'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void ticketsQuery.refetch()}
            disabled={ticketsQuery.isFetching}
          >
            Recargar
          </Button>
        </div>
      </header>

      <Alert>
        Datos de prueba en memoria. La integración con Baserow es el siguiente release y no
        requerirá modificar esta pantalla.
      </Alert>

      {/* El motivo se muestra porque una vista que cambia sola sin explicación
          parece un fallo. Desaparecerá cuando el usuario pueda elegirla. */}
      {mode === 'cards' ? <Alert>Vista de tarjetas ({reason}).</Alert> : null}

      {selectedTickets.length > 0 ? (
        <Alert>Seleccionados: {selectedTickets.map((ticket) => ticket.number).join(', ')}</Alert>
      ) : null}

      {detailTicket ? (
        <Alert>
          Detalle de {detailTicket.number}: la pantalla de detalle todavía no existe.{' '}
          <button type="button" className="underline" onClick={() => setDetailTicket(null)}>
            Cerrar
          </button>
        </Alert>
      ) : null}

      <TicketView
        kind={mode}
        tickets={tickets}
        loading={ticketsQuery.isPending}
        error={ticketsQuery.error}
        onViewDetail={setDetailTicket}
        onSelectionChange={setSelectedTickets}
      />
    </div>
  );
}
