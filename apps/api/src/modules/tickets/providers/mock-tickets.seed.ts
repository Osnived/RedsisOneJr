import {
  CUSTOM_COLUMN_SLOTS,
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
  type TicketMetadata,
  type TicketPriority,
  type TicketStatus,
  type TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Datos del origen simulado de Tickets.
 *
 * Existen para poder ejercitar el módulo completo antes de que haya un proveedor
 * real, y para que las pruebas no dependan de ninguna red. Todo se **deriva** de
 * una semilla corta en lugar de escribirse veinticinco veces: escritos a mano, un
 * ticket "en ruta" acababa con un timeline que no explicaba cómo llegó ahí, y la
 * incoherencia parecería un fallo de la aplicación.
 *
 * Nada aquí es aleatorio ni depende del reloj: la misma entrada produce siempre la
 * misma salida, que es lo que permite afirmar cosas concretas en las pruebas.
 */

interface TicketSeed {
  client: string;
  branch: string;
  city: string;
  status: TicketStatus;
  priority: TicketPriority;
  technician: string | null;
}

/** Técnicos disponibles. Técnicos todavía no es un módulo (ver PROJECT_STATUS.md). */
export const MOCK_TECHNICIANS = [
  'Ana Pérez',
  'Carlos Ruiz',
  'Luis Gómez',
  'Marta Díaz',
  'Sofía Ramírez',
];

/** Quien atiende el mostrador en los datos de prueba. */
export const MOCK_COORDINATOR = 'Coordinación';

const CLIENTS: [string, string, string][] = [
  ['Banco Andino', 'Sucursal Centro', 'Bogotá'],
  ['Supermercados del Valle', 'Tienda Norte', 'Cali'],
  ['Clínica Santa Fe', 'Sede Principal', 'Medellín'],
  ['Almacenes Éxito Retail', 'Centro Comercial Sur', 'Medellín'],
  ['Hotel Costa Azul', 'Sede Aeropuerto', 'Cartagena'],
  ['Distribuidora Caribe', 'Bodega Central', 'Barranquilla'],
  ['Panadería La Espiga', 'Local Comercial 12', 'Bucaramanga'],
];

const STATUSES: TicketStatus[] = [
  TICKET_STATUSES.NEW,
  TICKET_STATUSES.ASSIGNED,
  TICKET_STATUSES.ON_ROUTE,
  TICKET_STATUSES.ON_SITE,
  TICKET_STATUSES.PENDING,
  TICKET_STATUSES.RESOLVED,
  TICKET_STATUSES.CANCELLED,
];

const PRIORITIES: TicketPriority[] = [
  TICKET_PRIORITIES.HIGH,
  TICKET_PRIORITIES.MEDIUM,
  TICKET_PRIORITIES.CRITICAL,
  TICKET_PRIORITIES.LOW,
];

const SUBJECTS = [
  'Equipo fuera de servicio',
  'Falla intermitente en el sistema',
  'Instalación de equipo nuevo',
  'Revisión programada',
  'Reemplazo de componente',
];

const SERVICE_TYPES = ['Correctivo', 'Preventivo', 'Instalación'];

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

/** Zona de trabajo por ciudad. Zonas todavía no es un módulo (ver TECH_DEBT.md). */
const ZONE_BY_CITY: Record<string, string> = {
  Bogotá: 'Zona Centro',
  Medellín: 'Zona Antioquia',
  Cali: 'Zona Pacífico',
  Barranquilla: 'Zona Caribe',
  Cartagena: 'Zona Caribe',
  Bucaramanga: 'Zona Oriente',
};

/**
 * Pasos ya completados según el estado del ticket.
 *
 * Es la traducción inversa de lo que hace el flujo: si un ticket está en ruta, su
 * técnico ya confirmó y ya salió. Sin esto, un ticket en sitio ofrecería
 * "Confirmar asistencia" como si nada hubiera pasado.
 */
export const COMPLETED_STEPS_BY_STATUS: Record<TicketStatus, TicketWorkflowStep[]> = {
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

/** Cuántos tickets tiene el origen simulado. */
export const MOCK_TICKET_COUNT = 25;

function pick<TValue>(values: TValue[], index: number): TValue {
  const value = values[index % values.length];

  if (value === undefined) {
    throw new Error('La lista de valores de prueba no puede estar vacía.');
  }

  return value;
}

function seedOf(index: number): TicketSeed {
  const [client, branch, city] = pick(CLIENTS, index);
  const status = pick(STATUSES, index);

  return {
    client,
    branch,
    city,
    status,
    priority: pick(PRIORITIES, index),
    // Un ticket nuevo todavía no tiene a nadie: es lo que hace que la acción de
    // asignar tenga sobre qué actuar en cuanto se abre la aplicación.
    technician: status === TICKET_STATUSES.NEW ? null : pick(MOCK_TECHNICIANS, index),
  };
}

/** Fechas fijas y separadas entre sí, para que ordenar por fecha signifique algo. */
function datesOf(index: number): { createdAt: string; updatedAt: string } {
  const createdDay = 6 + (index % 24);
  const createdAt = `2026-07-${String(createdDay).padStart(2, '0')}T08:15:00.000Z`;
  const updatedDay = Math.min(createdDay + (index % 3), 30);

  return {
    createdAt,
    updatedAt: `2026-07-${String(updatedDay).padStart(2, '0')}T14:40:00.000Z`,
  };
}

/**
 * Datos adicionales de ejemplo.
 *
 * Pueblan tres de los veinte espacios disponibles y dejan el resto sin declarar,
 * que es el caso normal: un proyecto usa los que necesita. Uno de cada cuatro
 * tickets llega sin número de equipo a propósito, para que la tabla ejercite el
 * valor ausente en lugar de suponer que siempre viene todo.
 */
function metadataOf(index: number, updatedAt: string): TicketMetadata {
  const [dueDateSlot, serviceTypeSlot, equipmentSlot] = CUSTOM_COLUMN_SLOTS;

  if (dueDateSlot === undefined || serviceTypeSlot === undefined || equipmentSlot === undefined) {
    throw new Error('El catálogo de columnas adicionales no puede estar vacío.');
  }

  return {
    [dueDateSlot]: updatedAt,
    [serviceTypeSlot]: pick(SERVICE_TYPES, index),
    [equipmentSlot]: index % 4 === 0 ? null : `EQ-${1000 + index}`,
  };
}

function buildTicket(index: number): Ticket {
  const seed = seedOf(index);
  const { createdAt, updatedAt } = datesOf(index);

  return {
    id: String(index),
    number: `INC-2026-${String(100 + index).padStart(6, '0')}`,
    title: `${pick(SUBJECTS, index)} — ${seed.branch}`,
    clientName: seed.client,
    branchName: seed.branch,
    city: seed.city,
    zoneName: ZONE_BY_CITY[seed.city] ?? 'Zona sin asignar',
    status: seed.status,
    priority: seed.priority,
    technicianName: seed.technician,
    createdAt,
    updatedAt,
    metadata: metadataOf(index, updatedAt),
  };
}

export function buildTicketDetail(ticket: Ticket, index: number): TicketDetail {
  const address = `${pick(STREETS, index)} # ${10 + index}-${20 + index}, ${ticket.city}`;

  return {
    ...ticket,
    address,
    // Los orígenes reales meten aquí datos de contacto, ubicación del equipo y el
    // relato de la falla, todo en un solo campo largo.
    description: [
      `${ticket.title ?? 'Servicio solicitado'}.`,
      `Sucursal: ${ticket.branchName}, ${address}.`,
      `Categoría: ${pick(CATEGORIES, index)}.`,
    ].join(' '),
    categoryName: pick(CATEGORIES, index),
    completedSteps: [...COMPLETED_STEPS_BY_STATUS[ticket.status]],
  };
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

export function buildTicketTimeline(ticket: Ticket): TicketEvent[] {
  const events: TicketEvent[] = [
    event({
      id: `${ticket.id}-creado`,
      kind: TICKET_EVENT_KINDS.CREATED,
      description: `Ticket registrado para ${ticket.clientName}, ${ticket.branchName}.`,
      userName: MOCK_COORDINATOR,
      occurredAt: ticket.createdAt,
    }),
  ];

  if (ticket.technicianName !== null) {
    events.push(
      event({
        id: `${ticket.id}-asignado`,
        kind: TICKET_EVENT_KINDS.ASSIGNED,
        description: `Servicio asignado a ${ticket.technicianName}.`,
        userName: MOCK_COORDINATOR,
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
        userName: ticket.technicianName ?? MOCK_COORDINATOR,
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
        userName: ticket.technicianName ?? MOCK_COORDINATOR,
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
      userName: MOCK_COORDINATOR,
      changedAt: ticket.createdAt,
    });
  }

  if (ticket.status !== TICKET_STATUSES.NEW) {
    changes.push({
      id: `${ticket.id}-audit-estado`,
      field: TICKET_AUDIT_FIELDS.STATUS,
      previousValue: TICKET_STATUSES.NEW,
      newValue: ticket.status,
      userName: ticket.technicianName ?? MOCK_COORDINATOR,
      changedAt: ticket.updatedAt,
    });
  }

  return changes;
}

export function buildSeedTickets(): Ticket[] {
  return Array.from({ length: MOCK_TICKET_COUNT }, (_, position) => buildTicket(position + 1));
}
