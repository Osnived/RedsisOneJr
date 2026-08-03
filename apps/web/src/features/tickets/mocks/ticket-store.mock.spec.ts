/** @vitest-environment node */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  TICKET_AUDIT_FIELDS,
  TICKET_EVENT_KINDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WORKFLOW_SEQUENCE,
  TICKET_WORKFLOW_STEPS,
  nextWorkflowStep,
  type TicketDetail,
} from '@redsis/contracts';
import { TicketStepNotAvailableError, ticketStore } from './ticket-store.mock';

/**
 * Reglas del origen de datos simulado.
 *
 * Se prueban sin montar nada: son las reglas que decidirán qué transición es válida
 * y qué queda registrado, y viven fuera de React precisamente para poder
 * comprobarlas así. Cuando se muden al servicio de NestJS, estas pruebas describen
 * lo que tiene que seguir siendo cierto.
 */

const ACTOR = 'Quien Opera';

/**
 * Un ticket nuevo, sin técnico y con prioridad media: el punto de partida de todo
 * el flujo, y el único cuyo registro de cambios empieza vacío.
 */
const NEW_TICKET_ID = '14';

/** Un ticket en ruta: su técnico ya confirmó y ya salió. */
const ON_ROUTE_TICKET_ID = '3';

beforeEach(() => {
  ticketStore.reset();
});

function detailOf(ticketId: string): TicketDetail {
  const detail = ticketStore.findDetail(ticketId);

  if (detail === null) {
    throw new Error(`El ticket ${ticketId} debería existir en los datos de prueba.`);
  }

  return detail;
}

describe('consulta del origen simulado', () => {
  it('entrega el detalle con lo que la lista no lleva', () => {
    const detail = detailOf(NEW_TICKET_ID);

    expect(detail.zoneName.length).toBeGreaterThan(0);
    expect(detail.address.length).toBeGreaterThan(0);
    expect(detail.categoryName.length).toBeGreaterThan(0);
  });

  it('un identificador desconocido no existe, no falla', () => {
    expect(ticketStore.findDetail('no-existe')).toBeNull();
    expect(ticketStore.findTimeline('no-existe')).toBeNull();
    expect(ticketStore.findAuditLog('no-existe')).toBeNull();
  });

  it('el timeline de un ticket nuevo cuenta al menos su creación', () => {
    const timeline = ticketStore.findTimeline(NEW_TICKET_ID) ?? [];

    expect(timeline[0]?.kind).toBe(TICKET_EVENT_KINDS.CREATED);
  });

  it('un ticket nuevo no tiene ningún cambio auditado', () => {
    // Sin técnico, sin cambios de estado y con prioridad media no hay nada que
    // registrar. Un ticket recién creado no debe inventarse historia.
    expect(ticketStore.findAuditLog(NEW_TICKET_ID)).toEqual([]);
  });

  it('los pasos completados son coherentes con el estado', () => {
    const onRoute = detailOf(ON_ROUTE_TICKET_ID);

    expect(onRoute.status).toBe(TICKET_STATUSES.ON_ROUTE);
    expect(nextWorkflowStep(onRoute.completedSteps)).toBe(TICKET_WORKFLOW_STEPS.ARRIVE);
  });
});

describe('asignar técnico', () => {
  it('deja el ticket asignado si estaba nuevo', () => {
    const detail = ticketStore.assignTechnician(NEW_TICKET_ID, 'Ana Pérez', ACTOR);

    expect(detail?.technicianName).toBe('Ana Pérez');
    // Un ticket con técnico ya no está sin mirar.
    expect(detail?.status).toBe(TICKET_STATUSES.ASSIGNED);
  });

  it('audita el técnico y el estado, con el valor anterior', () => {
    ticketStore.assignTechnician(NEW_TICKET_ID, 'Ana Pérez', ACTOR);
    const auditLog = ticketStore.findAuditLog(NEW_TICKET_ID) ?? [];

    expect(auditLog).toEqual([
      expect.objectContaining({
        field: TICKET_AUDIT_FIELDS.TECHNICIAN,
        previousValue: null,
        newValue: 'Ana Pérez',
        userName: ACTOR,
      }),
      expect.objectContaining({
        field: TICKET_AUDIT_FIELDS.STATUS,
        previousValue: TICKET_STATUSES.NEW,
        newValue: TICKET_STATUSES.ASSIGNED,
      }),
    ]);
  });

  it('distingue una reasignación de una asignación', () => {
    ticketStore.assignTechnician(NEW_TICKET_ID, 'Ana Pérez', ACTOR);
    ticketStore.assignTechnician(NEW_TICKET_ID, 'Carlos Ruiz', ACTOR);

    const timeline = ticketStore.findTimeline(NEW_TICKET_ID) ?? [];

    expect(timeline.at(-1)?.description).toContain('reasignado de Ana Pérez a Carlos Ruiz');
  });
});

describe('cambiar prioridad', () => {
  it('registra el antes y el después', () => {
    ticketStore.changePriority(NEW_TICKET_ID, TICKET_PRIORITIES.CRITICAL, ACTOR);
    const auditLog = ticketStore.findAuditLog(NEW_TICKET_ID) ?? [];

    expect(auditLog.at(-1)).toEqual(
      expect.objectContaining({
        field: TICKET_AUDIT_FIELDS.PRIORITY,
        previousValue: TICKET_PRIORITIES.MEDIUM,
        newValue: TICKET_PRIORITIES.CRITICAL,
      }),
    );
  });

  it('no registra nada si la prioridad no cambia', () => {
    const current = detailOf(NEW_TICKET_ID).priority;
    ticketStore.changePriority(NEW_TICKET_ID, current, ACTOR);

    // Un registro de cambios lleno de "cambió de alta a alta" no sirve para auditar.
    expect(ticketStore.findAuditLog(NEW_TICKET_ID)).toEqual([]);
  });
});

describe('agregar observación', () => {
  it('va al timeline y no a la auditoría', () => {
    ticketStore.addObservation(NEW_TICKET_ID, 'El cliente pide avisar antes de ir.', ACTOR);

    expect(ticketStore.findTimeline(NEW_TICKET_ID)?.at(-1)).toEqual(
      expect.objectContaining({
        kind: TICKET_EVENT_KINDS.OBSERVATION,
        description: 'El cliente pide avisar antes de ir.',
        userName: ACTOR,
      }),
    );

    // No cambia ningún dato del ticket, así que no es un cambio que auditar.
    expect(ticketStore.findAuditLog(NEW_TICKET_ID)).toEqual([]);
  });
});

describe('flujo de la intervención', () => {
  it('acepta el paso disponible y lo suma a los completados', () => {
    const detail = ticketStore.completeStep(
      ON_ROUTE_TICKET_ID,
      TICKET_WORKFLOW_STEPS.ARRIVE,
      ACTOR,
    );

    expect(detail?.completedSteps).toContain(TICKET_WORKFLOW_STEPS.ARRIVE);
    expect(detail?.status).toBe(TICKET_STATUSES.ON_SITE);
  });

  it('rechaza adelantar el flujo', () => {
    // La interfaz solo ofrece un paso, pero quien guarda los datos no confía en eso.
    expect(() =>
      ticketStore.completeStep(ON_ROUTE_TICKET_ID, TICKET_WORKFLOW_STEPS.FINISH_SERVICE, ACTOR),
    ).toThrow(TicketStepNotAvailableError);
  });

  it('rechaza repetir un paso ya completado', () => {
    expect(() =>
      ticketStore.completeStep(ON_ROUTE_TICKET_ID, TICKET_WORKFLOW_STEPS.DEPART, ACTOR),
    ).toThrow(TicketStepNotAvailableError);
  });

  it('cada paso deja rastro en el timeline', () => {
    const before = ticketStore.findTimeline(ON_ROUTE_TICKET_ID)?.length ?? 0;
    ticketStore.completeStep(ON_ROUTE_TICKET_ID, TICKET_WORKFLOW_STEPS.ARRIVE, ACTOR);
    const timeline = ticketStore.findTimeline(ON_ROUTE_TICKET_ID) ?? [];

    expect(timeline.length).toBeGreaterThan(before);
    expect(timeline.some((event) => event.kind === TICKET_EVENT_KINDS.WORKFLOW)).toBe(true);
  });

  it('confirmar la asistencia no mueve el estado del servicio', () => {
    ticketStore.assignTechnician(NEW_TICKET_ID, 'Ana Pérez', ACTOR);
    const detail = ticketStore.completeStep(
      NEW_TICKET_ID,
      TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
      ACTOR,
    );

    expect(detail?.status).toBe(TICKET_STATUSES.ASSIGNED);
  });

  it('recorrido completo: termina cerrado y sin acciones', () => {
    ticketStore.assignTechnician(NEW_TICKET_ID, 'Ana Pérez', ACTOR);

    for (const step of TICKET_WORKFLOW_SEQUENCE) {
      ticketStore.completeStep(NEW_TICKET_ID, step, ACTOR);
    }

    const detail = detailOf(NEW_TICKET_ID);

    expect(nextWorkflowStep(detail.completedSteps)).toBeNull();
    expect(detail.status).toBe(TICKET_STATUSES.RESOLVED);
  });
});

describe('un solo origen para la lista y el detalle', () => {
  it('lo que cambia en el detalle se ve en la lista', () => {
    ticketStore.changePriority(NEW_TICKET_ID, TICKET_PRIORITIES.LOW, ACTOR);

    const listed = ticketStore.listTickets().find((ticket) => ticket.id === NEW_TICKET_ID);

    expect(listed?.priority).toBe(TICKET_PRIORITIES.LOW);
  });

  it('la lista no arrastra los campos del detalle', () => {
    const [listed] = ticketStore.listTickets();

    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty('zoneName');
    expect(listed).not.toHaveProperty('completedSteps');
  });

  it('reiniciar devuelve el origen a su estado inicial', () => {
    ticketStore.changePriority(NEW_TICKET_ID, TICKET_PRIORITIES.LOW, ACTOR);
    ticketStore.reset();

    expect(detailOf(NEW_TICKET_ID).priority).toBe(TICKET_PRIORITIES.MEDIUM);
  });
});
