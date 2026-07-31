import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS, type Ticket } from '@redsis/contracts';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/table';
import { TABLE_IDS } from '@/lib/table/registry';
import { getTicketRowId, ticketColumns } from '@/features/tickets/columns/ticket.columns';
import { useTickets } from '@/features/tickets/use-tickets';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

export const ticketsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tickets',
  component: TicketsPage,
});

/**
 * Pantalla de Tickets.
 *
 * Toda la funcionalidad de la tabla la aporta el framework: la página entrega
 * las columnas del módulo, los datos y el identificador de tabla.
 *
 * Los datos llegan por TanStack Query desde un servicio que hoy resuelve con
 * datos en memoria. Cuando se integre Baserow solo cambia el interior de ese
 * servicio: ni esta pantalla ni el DataTable se modifican.
 */
function TicketsPage(): React.JSX.Element {
  const can = useAuthStore((state) => state.can);

  // Interruptor de desarrollo para poder ver el estado de error de la tabla.
  // Desaparece cuando exista el origen real.
  const [shouldFail, setShouldFail] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);

  const ticketsQuery = useTickets({ shouldFail });

  if (!can(PERMISSIONS.TICKETS_VIEW)) {
    return <Alert variant="destructive">No tienes permiso para consultar tickets.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {ticketsQuery.isPending
              ? 'Consultando...'
              : `${ticketsQuery.data?.length ?? 0} incidentes registrados`}
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

      {selectedTickets.length > 0 ? (
        <Alert>Seleccionados: {selectedTickets.map((ticket) => ticket.number).join(', ')}</Alert>
      ) : null}

      <DataTable
        tableId={TABLE_IDS.TICKETS}
        columns={ticketColumns}
        data={ticketsQuery.data ?? []}
        getRowId={getTicketRowId}
        loading={ticketsQuery.isPending}
        error={ticketsQuery.error}
        enableRowSelection
        onRowSelectionChange={setSelectedTickets}
        searchPlaceholder="Buscar por ticket, cliente, sucursal..."
        emptyMessage="No hay tickets que coincidan con la búsqueda"
      />
    </div>
  );
}
