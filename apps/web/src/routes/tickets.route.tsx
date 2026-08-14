import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS, type Ticket } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { useViewMode } from '@/shared/hooks/use-view-mode';
import { DEFAULT_PAGE_SIZE, type TableQuery } from '@/shared/types/table';
import { TicketView } from '@/features/tickets/views';
import { useOpenTicket } from '@/features/tickets/use-open-ticket';
import { useTicketColumns, useTickets } from '@/features/tickets/use-tickets';
import { Forbidden } from '@/shared/components/layout/forbidden';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { authenticatedRoute } from './authenticated.route';

export const ticketsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tickets',
  component: TicketsPage,
});

/**
 * Consulta inicial: la primera página, sin orden, búsqueda ni filtros.
 *
 * Se declara fuera del componente para que su identidad sea estable: como forma
 * parte de la clave de caché, un objeto nuevo en cada render provocaría una
 * consulta nueva en cada render.
 */
const INITIAL_QUERY: TableQuery = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: '',
  sorting: [],
  filters: [],
};

/**
 * Pantalla de Tickets.
 *
 * Su cometido es **localizar** un ticket: consulta los datos, decide cómo
 * representarlos y lleva a la pantalla del ticket elegido. La operación no ocurre
 * aquí. Qué vista corresponde lo resuelve `useViewMode`, y cómo se dibuja cada una
 * es asunto de la vista; la página no consulta el tamaño de la pantalla ni el rol.
 *
 * Los datos llegan por TanStack Query desde el Repository, que habla con la API.
 * De dónde los saca la API —el origen simulado, RedsisOne, Baserow o ServiceNow—
 * esta pantalla no lo sabe: cambiar de proveedor no la toca.
 *
 * La consulta vive aquí y no en la vista porque la página es la única que conoce el
 * hook. La vista avisa de que algo cambió; pedir los datos es de este lado.
 */
function TicketsPage(): React.JSX.Element {
  const auth = useAuthorization();

  const [query, setQuery] = useState<TableQuery>(INITIAL_QUERY);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);

  const ticketsQuery = useTickets(query);
  const columns = useTicketColumns();
  const openTicket = useOpenTicket();
  const { mode, reason } = useViewMode();

  if (!auth.can(PERMISSIONS.TICKETS_VIEW)) {
    return <Forbidden detail="No tienes permiso para consultar tickets." />;
  }

  const page = ticketsQuery.data;
  const tickets = page?.items ?? [];
  const totalRows = page?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {ticketsQuery.isPending ? 'Consultando...' : `${totalRows} incidentes registrados`}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void ticketsQuery.refetch()}
          disabled={ticketsQuery.isFetching}
        >
          Recargar
        </Button>
      </header>

      {/* El motivo se muestra porque una vista que cambia sola sin explicación
          parece un fallo. Desaparecerá cuando el usuario pueda elegirla. */}
      {mode === 'cards' ? <Alert>Vista de tarjetas ({reason}).</Alert> : null}

      {selectedTickets.length > 0 ? (
        <Alert>Seleccionados: {selectedTickets.map((ticket) => ticket.number).join(', ')}</Alert>
      ) : null}

      <TicketView
        kind={mode}
        tickets={tickets}
        columns={columns}
        totalRows={totalRows}
        loading={ticketsQuery.isPending}
        error={ticketsQuery.error}
        onQueryChange={setQuery}
        onViewDetail={openTicket}
        onSelectionChange={setSelectedTickets}
      />
    </div>
  );
}
