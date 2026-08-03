import { ArrowRight, CircleCheckBig } from 'lucide-react';
import {
  PERMISSIONS,
  TICKET_WORKFLOW_SEQUENCE,
  TICKET_WORKFLOW_STEP_LABELS,
  nextWorkflowStep,
  type TicketDetail,
  type TicketWorkflowStep,
} from '@redsis/contracts';
import { DetailSection } from '@/shared/components/layout/detail-section';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCompleteWorkflowStep } from '../use-ticket-actions';

/**
 * Flujo guiado de la intervención.
 *
 * El técnico en campo no elige entre acciones: ve una sola, la que toca. Un menú
 * con seis opciones obliga a recordar en qué punto va el servicio, y se usa de pie,
 * con una mano y a veces con guantes.
 *
 * Cuál es la acción disponible se deriva de los pasos ya completados con la regla
 * del contrato compartido, así que la interfaz no puede ofrecer un paso adelantado.
 * El origen de datos vuelve a comprobarlo: quien guarda decide qué transición vale.
 *
 * Exige `tickets.edit`, igual que las acciones del coordinador.
 *
 * En pantalla pequeña la acción vive en una barra fija al pie, al alcance del
 * pulgar. En escritorio es una sección más de la columna de acciones. Son dos
 * interfaces para el mismo acto, no una con partes escondidas: el botón existe una
 * sola vez, así que quien usa un lector de pantalla no encuentra dos iguales.
 */
export function TicketWorkflowPanel({
  ticket,
}: {
  ticket: TicketDetail;
}): React.JSX.Element | null {
  const auth = useAuthorization();
  const isMobile = useIsMobile();
  const completeStep = useCompleteWorkflowStep(ticket.id);

  if (!auth.can(PERMISSIONS.TICKETS_EDIT)) {
    return null;
  }

  const step = ticket.technicianName === null ? null : nextWorkflowStep(ticket.completedSteps);
  const progress = `Paso ${ticket.completedSteps.length + 1} de ${TICKET_WORKFLOW_SEQUENCE.length}`;

  const action = (
    <StepButton
      step={step}
      isPending={completeStep.isPending}
      onComplete={(next) => completeStep.mutate(next)}
    />
  );

  const failure = completeStep.isError ? (
    <Alert variant="destructive">{completeStep.error.message}</Alert>
  ) : null;

  // Con la intervención cerrada o sin técnico no hay nada que alcanzar: el estado
  // se cuenta en la sección de siempre en lugar de ocupar el pie con un aviso.
  if (isMobile && step !== null) {
    return (
      <div
        // Por encima del contenido y por debajo de los diálogos, y justo encima de
        // la navegación inferior de la aplicación.
        className="fixed inset-x-0 bottom-14 z-30 flex flex-col gap-2 border-t border-border bg-background px-4 py-3"
      >
        {failure}

        <p className="text-xs text-muted-foreground">Intervención · {progress}</p>
        {action}
      </div>
    );
  }

  return (
    <DetailSection
      title="Intervención"
      description={step === null ? 'Sin acción pendiente' : progress}
    >
      <div className="flex flex-col gap-3">
        {failure}

        {step === null ? <ClosedMessage ticket={ticket} /> : action}
      </div>
    </DetailSection>
  );
}

/**
 * El único botón del flujo.
 *
 * Grande y a todo el ancho porque es la acción principal de la pantalla para quien
 * está en la sucursal: un objetivo pequeño se falla de pie y con una mano.
 */
function StepButton({
  step,
  isPending,
  onComplete,
}: {
  step: TicketWorkflowStep | null;
  isPending: boolean;
  onComplete: (step: TicketWorkflowStep) => void;
}): React.JSX.Element | null {
  if (step === null) {
    return null;
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isPending}
      onClick={() => {
        onComplete(step);
      }}
    >
      {isPending ? <Spinner /> : <ArrowRight aria-hidden="true" />}
      {TICKET_WORKFLOW_STEP_LABELS[step]}
    </Button>
  );
}

/** Por qué no hay ninguna acción. Un panel vacío parece un fallo. */
function ClosedMessage({ ticket }: { ticket: TicketDetail }): React.JSX.Element {
  if (ticket.technicianName === null) {
    return (
      <p className="text-sm text-muted-foreground">
        El flujo empieza cuando el servicio tenga un técnico asignado.
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <CircleCheckBig className="size-4 shrink-0 text-success" aria-hidden="true" />
      Intervención cerrada. No queda ninguna acción.
    </p>
  );
}
