import {
  TICKET_AUDIT_FIELDS,
  TICKET_EVENT_KINDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TICKET_WORKFLOW_STEPS,
  type Ticket,
  type TicketDetail,
  type TicketEvent,
  type TicketFieldChange,
  type TicketStatus,
  type TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Semilla del espacio de trabajo de un ticket.
 *
 * Completa lo que la lista no lleva —dirección, zona, categoría— y construye el
 * timeline y la auditoría que tendría un ticket que ha llegado a su estado actual.
 *
 * Se **deriva** del ticket en lugar de escribirse a mano veinticinco veces. No es
 * por ahorrar líneas: escritos a mano, un ticket "en ruta" podía acabar con un
 * timeline que no explicaba cómo llegó ahí, y la incoherencia parecería un fallo
 * de la pantalla. Derivándolo, cada ticket cuenta una historia consistente con su
 * estado, su técnico y sus fechas.
 *
 * Todo sale de datos fijos del propio ticket, así que la pantalla y las pruebas
 * muestran siempre lo mismo. Cuando llegue Baserow, este archivo se elimina.
 */

/** Zona de trabajo por ciudad. Zonas todavía no es un módulo (ver TECH_DEBT.md). */
const ZONE_BY_CITY: Record<string, string> = {
  Bogotá: 'Zona Centro',
  Medellín: 'Zona Antioquia',
  Cali: 'Zona Pacífico',
  Barranquilla: 'Zona Caribe',
  Cartagena: 'Zona Caribe',
  Bucaramanga: 'Zona Oriente',
};

const CATEGORIES = [
  'Mantenimiento correctivo',
  'Instalación de equipo',
  'Revisión preventiva',
  'Soporte en sitio',
];

const STREETS = [
  'Calle 72',
  'Avenida El Dorado',
  'Carrera 43A',
  'Diagonal 25',
  'Avenida Circunvalar',
];

/**
 * Pasos ya completados según el estado del ticket.
 *
 * Es la traducción inversa de lo que hace el flujo: si un ticket está en ruta, su
 * técnico ya confirmó y ya salió. Sin esto, un ticket en sitio ofrecería
 * "Confirmar asistencia" como si nada hubiera pasado.
 */
const COMPLETED_STEPS_BY_STATUS: Record<TicketStatus, TicketWorkflowStep[]> = {
  nuevo: [],
  asignado: [],
  'en-ruta': [TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE, TICKET_WORKFLOW_STEPS.DEPART],
  'en-sitio': [
    TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
    TICKET_WORKFLOW_STEPS.DEPART,
    TICKET_WORKFLOW_STEPS.ARRIVE,
  ],
  pendiente: [
    TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
    TICKET_WORKFLOW_STEPS.DEPART,
    TICKET_WORKFLOW_STEPS.ARRIVE,
    TICKET_WORKFLOW_STEPS.START_SERVICE,
  ],
  resuelto: [
    TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
    TICKET_WORKFLOW_STEPS.DEPART,
    TICKET_WORKFLOW_STEPS.ARRIVE,
    TICKET_WORKFLOW_STEPS.START_SERVICE,
    TICKET_WORKFLOW_STEPS.FINISH_SERVICE,
  ],
  // Un servicio cancelado no tiene intervención que continuar.
  cancelado: [
    TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
    TICKET_WORKFLOW_STEPS.DEPART,
    TICKET_WORKFLOW_STEPS.ARRIVE,
    TICKET_WORKFLOW_STEPS.START_SERVICE,
    TICKET_WORKFLOW_STEPS.FINISH_SERVICE,
    TICKET_WORKFLOW_STEPS.CLOSE,
  ],
};

/** Quien atiende el mostrador en los datos de prueba. */
const COORDINATOR = 'Coordinación';

export function buildTicketDetail(ticket: Ticket): TicketDetail {
  return {
    ...ticket,
    address: `${pick(STREETS, ticket.id)} # ${10 + numberOf(ticket.id)}-${20 + numberOf(ticket.id)}, ${ticket.city}`,
    zoneName: ZONE_BY_CITY[ticket.city] ?? 'Zona sin asignar',
    categoryName: pick(CATEGORIES, ticket.id),
    completedSteps: [...COMPLETED_STEPS_BY_STATUS[ticket.status]],
  };
}

/**
 * Timeline coherente con el estado del ticket.
 *
 * Se cuenta de lo más antiguo a lo más reciente porque una intervención se lee en
 * el orden en que ocurrió; la pantalla decide si lo invierte.
 */
export function buildTicketTimeline(ticket: Ticket): TicketEvent[] {
  const events: TicketEvent[] = [
    event({
      id: `${ticket.id}-creado`,
      kind: TICKET_EVENT_KINDS.CREATED,
      description: `Ticket registrado para ${ticket.clientName}, ${ticket.branchName}.`,
      userName: COORDINATOR,
      occurredAt: ticket.createdAt,
    }),
  ];

  if (ticket.technicianName !== null) {
    events.push(
      event({
        id: `${ticket.id}-asignado`,
        kind: TICKET_EVENT_KINDS.ASSIGNED,
        description: `Servicio asignado a ${ticket.technicianName}.`,
        userName: COORDINATOR,
        occurredAt: ticket.createdAt,
      }),
    );
  }

  for (const step of COMPLETED_STEPS_BY_STATUS[ticket.status]) {
    events.push(
      event({
        id: `${ticket.id}-${step}`,
        kind: TICKET_EVENT_KINDS.WORKFLOW,
        description: describeStep(step),
        userName: ticket.technicianName ?? COORDINATOR,
        occurredAt: ticket.updatedAt,
      }),
    );
  }

  if (ticket.status !== TICKET_STATUSES.NEW) {
    events.push(
      event({
        id: `${ticket.id}-estado`,
        kind: TICKET_EVENT_KINDS.STATUS_CHANGED,
        description: `El servicio pasó a ${TICKET_STATUS_LABELS[ticket.status]}.`,
        userName: ticket.technicianName ?? COORDINATOR,
        occurredAt: ticket.updatedAt,
      }),
    );
  }

  return events;
}

/**
 * Auditoría coherente con el estado del ticket.
 *
 * Solo registra cambios de un dato: no repite lo que ya cuenta el timeline. Un
 * ticket recién creado no tiene ningún cambio, y eso es información, no un hueco.
 */
export function buildTicketAuditLog(ticket: Ticket): TicketFieldChange[] {
  const changes: TicketFieldChange[] = [];

  if (ticket.technicianName !== null) {
    changes.push({
      id: `${ticket.id}-audit-tecnico`,
      field: TICKET_AUDIT_FIELDS.TECHNICIAN,
      previousValue: null,
      newValue: ticket.technicianName,
      userName: COORDINATOR,
      changedAt: ticket.createdAt,
    });
  }

  if (
    ticket.priority === TICKET_PRIORITIES.CRITICAL ||
    ticket.priority === TICKET_PRIORITIES.HIGH
  ) {
    changes.push({
      id: `${ticket.id}-audit-prioridad`,
      field: TICKET_AUDIT_FIELDS.PRIORITY,
      previousValue: TICKET_PRIORITIES.MEDIUM,
      newValue: ticket.priority,
      userName: COORDINATOR,
      changedAt: ticket.createdAt,
    });
  }

  if (ticket.status !== TICKET_STATUSES.NEW) {
    changes.push({
      id: `${ticket.id}-audit-estado`,
      field: TICKET_AUDIT_FIELDS.STATUS,
      previousValue: TICKET_STATUSES.NEW,
      newValue: ticket.status,
      userName: ticket.technicianName ?? COORDINATOR,
      changedAt: ticket.updatedAt,
    });
  }

  return changes;
}

/** Descripción en pasado de un paso del flujo, para el timeline. */
export function describeStep(step: TicketWorkflowStep): string {
  const descriptions: Record<TicketWorkflowStep, string> = {
    'confirmar-asistencia': 'Asistencia confirmada.',
    'salir-hacia-la-sucursal': 'Salida hacia la sucursal.',
    llegue: 'Llegada a la sucursal.',
    'iniciar-servicio': 'Servicio iniciado.',
    'finalizar-servicio': 'Servicio finalizado.',
    'cerrar-intervencion': 'Intervención cerrada.',
  };

  return descriptions[step];
}

/**
 * Entrada del timeline con la posición y los adjuntos vacíos.
 *
 * Los declara siempre para que añadir GPS o fotografías no cambie la forma de una
 * entrada, solo su contenido.
 */
function event(values: Omit<TicketEvent, 'location' | 'attachments'>): TicketEvent {
  return { ...values, location: null, attachments: [] };
}

/** Reparto estable: el mismo ticket recibe siempre el mismo valor. */
function pick<TValue>(values: TValue[], ticketId: string): TValue {
  const value = values[numberOf(ticketId) % values.length];

  if (value === undefined) {
    throw new Error('La lista de valores de prueba no puede estar vacía.');
  }

  return value;
}

function numberOf(ticketId: string): number {
  const parsed = Number.parseInt(ticketId, 10);

  return Number.isNaN(parsed) ? ticketId.length : parsed;
}

/** Técnicos disponibles. Técnicos todavía no es un módulo (ver PROJECT_STATUS.md). */
export const MOCK_TECHNICIANS = [
  'Ana Pérez',
  'Carlos Ruiz',
  'Luis Gómez',
  'Marta Díaz',
  'Sofía Ramírez',
];

export { COORDINATOR as MOCK_COORDINATOR };
