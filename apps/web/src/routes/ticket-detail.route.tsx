import { Link, createRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { PERMISSIONS } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Spinner } from '@/shared/components/ui/spinner';
import { Forbidden } from '@/shared/components/layout/forbidden';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { TicketWorkspace } from '@/features/tickets/detail/ticket-workspace';
import { useTicket } from '@/features/tickets/use-tickets';
import { authenticatedRoute } from './authenticated.route';

/**
 * Pantalla de un ticket.
 *
 * Cuelga de `authenticatedRoute`, así que el acceso al módulo se aplica solo: el
 * catálogo resuelve `/tickets/...` como Tickets por prefijo y quien no tenga el
 * módulo recibe el 403 sin que esta ruta lo compruebe.
 *
 * El parámetro se llama `ticketId` y no `id` porque en el resto de la aplicación
 * se lee acompañado de su dominio; la URL resultante es la misma.
 */
export const ticketDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tickets/$ticketId',
  component: TicketDetailPage,
});

/**
 * Orquesta el espacio de trabajo: pide el ticket y elige qué mostrar.
 *
 * No dibuja el ticket. Eso es conocimiento del dominio y vive en la feature, que
 * recibe un ticket ya resuelto y no sabe nada de rutas ni de consultas.
 */
function TicketDetailPage(): React.JSX.Element {
  const auth = useAuthorization();
  const { ticketId } = ticketDetailRoute.useParams();
  const ticketQuery = useTicket(ticketId);

  if (!auth.can(PERMISSIONS.TICKETS_VIEW)) {
    return <Forbidden detail="No tienes permiso para consultar tickets." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Un espacio de trabajo al que se llega desde una tabla necesita la vuelta
          explícita: el historial del navegador no está a mano en un móvil. */}
      <Link
        to="/tickets"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a Tickets
      </Link>

      {renderTicket()}
    </div>
  );

  function renderTicket(): React.JSX.Element {
    if (ticketQuery.isPending) {
      return (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      );
    }

    if (ticketQuery.isError) {
      return <Alert variant="destructive">{ticketQuery.error.message}</Alert>;
    }

    return <TicketWorkspace ticket={ticketQuery.data} />;
  }
}
