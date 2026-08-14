import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WORKFLOW_STEPS,
  type PaginatedResult,
  type Ticket,
  type TicketDetail,
  type TicketPriority,
  type TicketStatus,
  type TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Tickets de ejemplo para las pruebas del frontend.
 *
 * Sustituyen a los datos simulados que vivían dentro de la feature. Ya no pueden
 * estar ahí: desde que Tickets tiene módulo en NestJS el frontend no tiene origen
 * propio, y dejar un mock dentro de `features/` invitaría a que algún componente lo
 * consumiera en lugar de pasar por el Repository.
 *
 * Son fixtures de prueba y no un origen de datos: solo los usan los archivos
 * `.spec`. Reproducen la misma distribución que sirve el proveedor simulado del
 * backend, de modo que lo que comprueban las pruebas del framework de tablas
 * —buscar, ordenar, agrupar, paginar— sigue midiendo lo mismo.
 *
 * Todo se deriva de una semilla corta y nada depende del reloj ni del azar: la
 * misma entrada produce siempre la misma salida.
 */

const CLIENTS: [string, string, string, string][] = [
  ['Banco Andino', 'Sucursal Centro', 'Bogotá', 'Zona Centro'],
  ['Supermercados del Valle', 'Tienda Norte', 'Cali', 'Zona Pacífico'],
  ['Clínica Santa Fe', 'Sede Principal', 'Medellín', 'Zona Antioquia'],
  ['Almacenes Éxito Retail', 'Centro Comercial Sur', 'Medellín', 'Zona Antioquia'],
  ['Hotel Costa Azul', 'Sede Aeropuerto', 'Cartagena', 'Zona Caribe'],
  ['Distribuidora Caribe', 'Bodega Central', 'Barranquilla', 'Zona Caribe'],
  ['Panadería La Espiga', 'Local Comercial 12', 'Bucaramanga', 'Zona Oriente'],
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

const TECHNICIANS = ['Ana Pérez', 'Carlos Ruiz', 'Luis Gómez', 'Marta Díaz', 'Sofía Ramírez'];

function pick<TValue>(values: TValue[], position: number): TValue {
  const value = values[position % values.length];

  if (value === undefined) {
    throw new Error('La lista de valores de prueba no puede estar vacía.');
  }

  return value;
}

function ticketAt(position: number): Ticket {
  const [clientName, branchName, city, zoneName] = pick(CLIENTS, position);
  const status = pick(STATUSES, position);
  const day = String(6 + (position % 24)).padStart(2, '0');
  const updatedAt = `2026-07-${day}T14:40:00.000Z`;

  return {
    id: String(position + 1),
    number: `INC-2026-${String(101 + position).padStart(6, '0')}`,
    title: `Servicio en ${branchName}`,
    clientName,
    branchName,
    city,
    zoneName,
    status,
    priority: pick(PRIORITIES, position),
    // Un ticket nuevo todavía no tiene a nadie: es lo que hace que la acción de
    // asignar tenga sobre qué actuar.
    technicianName: status === TICKET_STATUSES.NEW ? null : pick(TECHNICIANS, position + 4),
    createdAt: `2026-07-${day}T08:15:00.000Z`,
    updatedAt,
    metadata: {
      ColumnaAgrega1: updatedAt,
      ColumnaAgrega2: pick(['Correctivo', 'Preventivo', 'Instalación'], position),
      ColumnaAgrega3: position % 4 === 0 ? null : `EQ-${1001 + position}`,
    },
  };
}

export function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return { ...ticketAt(0), ...overrides };
}

/**
 * Pasos ya completados según el estado del ticket.
 *
 * No es una regla de negocio, es coherencia del dato de prueba: un ticket "en
 * ruta" cuyo técnico no hubiera confirmado ni salido describiría algo que no puede
 * haber ocurrido, y la pantalla ofrecería "Confirmar asistencia" como si nada
 * hubiera pasado. Quién decide las transiciones de verdad es el servicio de NestJS.
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
  cancelado: [
    TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
    TICKET_WORKFLOW_STEPS.DEPART,
    TICKET_WORKFLOW_STEPS.ARRIVE,
    TICKET_WORKFLOW_STEPS.START_SERVICE,
    TICKET_WORKFLOW_STEPS.FINISH_SERVICE,
    TICKET_WORKFLOW_STEPS.CLOSE,
  ],
};

export function buildTicketDetail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  const ticket = { ...buildTicket(), ...overrides };

  return {
    ...ticket,
    address: `Calle 72 # 11-30, ${ticket.city}`,
    description: `${ticket.title}. Sucursal: ${ticket.branchName}.`,
    categoryName: 'Mantenimiento correctivo',
    completedSteps: [...COMPLETED_STEPS_BY_STATUS[ticket.status]],
    ...overrides,
  };
}

/** Veinticinco tickets con estados, ciudades y técnicos variados. */
export const MOCK_TICKETS: Ticket[] = Array.from({ length: 25 }, (_, position) =>
  ticketAt(position),
);

/** La respuesta paginada tal como la entrega la API. */
export function buildTicketPage(items: Ticket[] = MOCK_TICKETS): PaginatedResult<Ticket> {
  return {
    items,
    page: 1,
    pageSize: 25,
    total: items.length,
    totalPages: 1,
  };
}
