import type { Ticket } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';

/**
 * Espacio de trabajo de un ticket.
 *
 * Desde este release el ticket es el centro del sistema: la tabla solo sirve para
 * encontrarlo y toda la operación ocurre aquí.
 *
 * Vive en la feature y no en la ruta porque conoce el dominio. La ruta aporta el
 * identificador, la consulta y los estados; este componente solo representa un
 * ticket que ya existe, así que se prueba sin montar el enrutador ni React Query.
 *
 * De momento solo lo identifica: la cabecera, el layout, la información general,
 * el timeline, la auditoría y las acciones son los MVP siguientes.
 */
export function TicketDetail({ ticket }: { ticket: Ticket }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">{ticket.number}</h1>
        <p className="text-sm text-muted-foreground">
          {ticket.clientName} · {ticket.branchName}
        </p>
      </header>

      <Alert>
        El espacio de trabajo del ticket está en construcción. Por ahora esta pantalla solo confirma
        que la fila lleva hasta aquí.
      </Alert>
    </div>
  );
}
