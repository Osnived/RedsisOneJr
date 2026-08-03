import { useState } from 'react';
import { Flag, MessageSquarePlus, UserPlus } from 'lucide-react';
import { PERMISSIONS, type TicketDetail } from '@redsis/contracts';
import { DetailSection } from '@/shared/components/layout/detail-section';
import { Button } from '@/shared/components/ui/button';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import {
  useAddTicketObservation,
  useAssignTechnician,
  useChangeTicketPriority,
} from '../use-ticket-actions';
import { useAssignableTechnicians } from '../use-tickets';
import {
  AddObservationForm,
  AssignTechnicianForm,
  ChangePriorityForm,
} from './ticket-action-forms';

/** Qué formulario está abierto. Solo puede haber uno: son operaciones distintas. */
type OpenAction = 'assign' | 'priority' | 'observation' | null;

/**
 * Acciones del coordinador sobre el ticket.
 *
 * Es la parte de la pantalla desde la que se opera el servicio sin estar en la
 * sucursal: quién lo atiende, con qué urgencia y qué hay que saber. El flujo del
 * técnico es otra cosa y tiene su propio panel.
 *
 * Cada acción abre un formulario en lugar de cambiar el dato al pulsar: asignar a
 * alguien o subir la prioridad son decisiones, y una decisión no debe ocurrir por
 * un clic accidental. Las tres quedan registradas —el timeline, la auditoría o
 * ambos— sin que este componente sepa cómo.
 *
 * Exige `tickets.edit`. Quien solo puede consultar ve el ticket y no las acciones,
 * y se pregunta al servicio de autorización, nunca por el nombre del rol (ver
 * AGENTS.md).
 */
export function TicketActionsPanel({ ticket }: { ticket: TicketDetail }): React.JSX.Element | null {
  const auth = useAuthorization();
  const [openAction, setOpenAction] = useState<OpenAction>(null);

  const technicians = useAssignableTechnicians();
  const assignTechnician = useAssignTechnician(ticket.id);
  const changePriority = useChangeTicketPriority(ticket.id);
  const addObservation = useAddTicketObservation(ticket.id);

  if (!auth.can(PERMISSIONS.TICKETS_EDIT)) {
    return null;
  }

  const close = (): void => {
    setOpenAction(null);
    assignTechnician.reset();
    changePriority.reset();
    addObservation.reset();
  };

  return (
    <DetailSection title="Acciones" description="Operación del coordinador">
      {/* A todo el ancho y apiladas: en un móvil el pulgar no acierta un botón
          pequeño, y en escritorio el panel es una columna estrecha. */}
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="justify-start" onClick={() => setOpenAction('assign')}>
          <UserPlus aria-hidden="true" />
          {ticket.technicianName === null ? 'Asignar técnico' : 'Reasignar técnico'}
        </Button>

        <Button
          variant="outline"
          className="justify-start"
          onClick={() => setOpenAction('priority')}
        >
          <Flag aria-hidden="true" />
          Cambiar prioridad
        </Button>

        <Button
          variant="outline"
          className="justify-start"
          onClick={() => setOpenAction('observation')}
        >
          <MessageSquarePlus aria-hidden="true" />
          Agregar observación
        </Button>
      </div>

      {openAction === 'assign' ? (
        <AssignTechnicianForm
          technicians={technicians.data ?? []}
          currentTechnician={ticket.technicianName}
          onClose={close}
          onSubmit={(values) => assignTechnician.mutate(values, { onSuccess: close })}
          isSubmitting={assignTechnician.isPending}
          error={assignTechnician.error}
        />
      ) : null}

      {openAction === 'priority' ? (
        <ChangePriorityForm
          currentPriority={ticket.priority}
          onClose={close}
          onSubmit={(values) => changePriority.mutate(values, { onSuccess: close })}
          isSubmitting={changePriority.isPending}
          error={changePriority.error}
        />
      ) : null}

      {openAction === 'observation' ? (
        <AddObservationForm
          onClose={close}
          onSubmit={(values) => addObservation.mutate(values, { onSuccess: close })}
          isSubmitting={addObservation.isPending}
          error={addObservation.error}
        />
      ) : null}
    </DetailSection>
  );
}
