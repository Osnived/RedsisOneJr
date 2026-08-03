import { describe, expect, it } from 'vitest';
import {
  TICKET_AUDIT_FIELDS,
  TICKET_AUDIT_FIELD_LABELS,
  TICKET_EVENT_KINDS,
  TICKET_EVENT_KIND_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TICKET_WORKFLOW_SEQUENCE,
  TICKET_WORKFLOW_STEPS,
  TICKET_WORKFLOW_STEP_LABELS,
  nextWorkflowStep,
  type TicketWorkflowStep,
} from './tickets.js';

describe('catálogos del ticket', () => {
  it('todo estado y toda prioridad tienen etiqueta', () => {
    for (const status of Object.values(TICKET_STATUSES)) {
      expect(TICKET_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }

    for (const priority of Object.values(TICKET_PRIORITIES)) {
      expect(TICKET_PRIORITY_LABELS[priority].length).toBeGreaterThan(0);
    }
  });

  it('toda clase de suceso y todo campo auditado tienen etiqueta', () => {
    for (const kind of Object.values(TICKET_EVENT_KINDS)) {
      expect(TICKET_EVENT_KIND_LABELS[kind].length).toBeGreaterThan(0);
    }

    for (const field of Object.values(TICKET_AUDIT_FIELDS)) {
      expect(TICKET_AUDIT_FIELD_LABELS[field].length).toBeGreaterThan(0);
    }
  });
});

describe('flujo de la intervención', () => {
  it('la secuencia contiene cada paso una sola vez', () => {
    const steps = Object.values(TICKET_WORKFLOW_STEPS);

    expect([...TICKET_WORKFLOW_SEQUENCE].sort()).toEqual([...steps].sort());
  });

  it('todo paso tiene etiqueta', () => {
    for (const step of TICKET_WORKFLOW_SEQUENCE) {
      expect(TICKET_WORKFLOW_STEP_LABELS[step].length).toBeGreaterThan(0);
    }
  });

  it('sin nada completado, el paso disponible es confirmar la asistencia', () => {
    expect(nextWorkflowStep([])).toBe(TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE);
  });

  it('el paso disponible es el primero que falta', () => {
    const completed: TicketWorkflowStep[] = [
      TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
      TICKET_WORKFLOW_STEPS.DEPART,
    ];

    expect(nextWorkflowStep(completed)).toBe(TICKET_WORKFLOW_STEPS.ARRIVE);
  });

  it('el orden en que se completaron no altera qué toca ahora', () => {
    // El flujo lo define la secuencia, no el historial: un dato desordenado no
    // debe poder ofrecer un paso adelantado.
    const completed: TicketWorkflowStep[] = [
      TICKET_WORKFLOW_STEPS.DEPART,
      TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
    ];

    expect(nextWorkflowStep(completed)).toBe(TICKET_WORKFLOW_STEPS.ARRIVE);
  });

  it('con la intervención cerrada no queda ninguna acción', () => {
    expect(nextWorkflowStep([...TICKET_WORKFLOW_SEQUENCE])).toBeNull();
  });
});
