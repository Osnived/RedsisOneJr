/**
 * Modelo de dominio de Ticket.
 *
 * Vive en los contratos compartidos y no en el frontend porque el mismo tipo lo
 * servirá el backend cuando se integre Baserow. Definirlo aquí evita que el
 * frontend invente una forma que después no coincida con la del origen de datos.
 *
 * Un Ticket también se denomina Incidente: son equivalentes y no existe
 * diferencia funcional (ver PROJECT_CONTEXT.md).
 */

import { z } from 'zod';

/**
 * Estados del ciclo de vida. El catálogo puede cambiar según el proyecto, por eso
 * se declara como constante y no como enumeración cerrada del lenguaje.
 */
export const TICKET_STATUSES = {
  NEW: 'nuevo',
  ASSIGNED: 'asignado',
  ON_ROUTE: 'en-ruta',
  ON_SITE: 'en-sitio',
  PENDING: 'pendiente',
  RESOLVED: 'resuelto',
  CANCELLED: 'cancelado',
} as const;

export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const TICKET_PRIORITIES = {
  LOW: 'baja',
  MEDIUM: 'media',
  HIGH: 'alta',
  CRITICAL: 'critica',
} as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];

/** Etiquetas legibles. Separadas del código para poder traducirlas sin tocar datos. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  nuevo: 'Nuevo',
  asignado: 'Asignado',
  'en-ruta': 'En ruta',
  'en-sitio': 'En sitio',
  pendiente: 'Pendiente',
  resuelto: 'Resuelto',
  cancelado: 'Cancelado',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export interface Ticket {
  id: string;

  /**
   * Número visible del ticket, por ejemplo `INC-2026-000145` o `10025489`.
   * Nunca cambia y es la referencia principal durante toda la vida del servicio.
   */
  number: string;

  clientName: string;
  branchName: string;
  city: string;

  status: TicketStatus;
  priority: TicketPriority;

  /** Nulo mientras el ticket no tenga técnico asignado. */
  technicianName: string | null;

  /** Fechas en formato ISO 8601, igual que el resto de los contratos. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Pasos del flujo guiado de una intervención.
 *
 * El técnico en campo no elige entre acciones: avanza. Cada paso es una cosa que
 * ocurrió de verdad —salió, llegó, empezó, terminó— y solo tiene sentido después
 * del anterior, así que el flujo se declara como una secuencia y no como un
 * conjunto de acciones sueltas.
 *
 * Es un concepto distinto del estado del ticket: el estado dice en qué situación
 * está el servicio para toda la plataforma, y el paso dice por dónde va la
 * intervención de quien lo atiende. Hay más pasos que estados porque "iniciar
 * servicio" y "cerrar intervención" no cambian la situación del servicio.
 */
export const TICKET_WORKFLOW_STEPS = {
  CONFIRM_ATTENDANCE: 'confirmar-asistencia',
  DEPART: 'salir-hacia-la-sucursal',
  ARRIVE: 'llegue',
  START_SERVICE: 'iniciar-servicio',
  FINISH_SERVICE: 'finalizar-servicio',
  CLOSE: 'cerrar-intervencion',
} as const;

export type TicketWorkflowStep = (typeof TICKET_WORKFLOW_STEPS)[keyof typeof TICKET_WORKFLOW_STEPS];

export const TICKET_WORKFLOW_STEP_LABELS: Record<TicketWorkflowStep, string> = {
  'confirmar-asistencia': 'Confirmar asistencia',
  'salir-hacia-la-sucursal': 'Salir hacia la sucursal',
  llegue: 'Llegué',
  'iniciar-servicio': 'Iniciar servicio',
  'finalizar-servicio': 'Finalizar servicio',
  'cerrar-intervencion': 'Cerrar intervención',
};

/** Orden del flujo. Es la única fuente de qué viene después de qué. */
export const TICKET_WORKFLOW_SEQUENCE: readonly TicketWorkflowStep[] = [
  TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
  TICKET_WORKFLOW_STEPS.DEPART,
  TICKET_WORKFLOW_STEPS.ARRIVE,
  TICKET_WORKFLOW_STEPS.START_SERVICE,
  TICKET_WORKFLOW_STEPS.FINISH_SERVICE,
  TICKET_WORKFLOW_STEPS.CLOSE,
];

/**
 * Único paso disponible, o null si la intervención ya está cerrada.
 *
 * Se deriva de lo que se ha completado en lugar de almacenarse: un campo
 * "siguiente paso" podría quedar en desacuerdo con el historial, y entonces
 * habría dos versiones de la verdad.
 *
 * Vive en el contrato compartido porque la misma regla decide qué botón se dibuja
 * y qué transición se acepta. Si estuviera solo en el frontend, la interfaz y el
 * origen de datos podrían discrepar sobre qué toca ahora.
 */
export function nextWorkflowStep(completedSteps: TicketWorkflowStep[]): TicketWorkflowStep | null {
  return TICKET_WORKFLOW_SEQUENCE.find((step) => !completedSteps.includes(step)) ?? null;
}

/**
 * Un ticket con todo lo que necesita su espacio de trabajo.
 *
 * Se separa de `Ticket` porque el detalle es más rico que una fila: la dirección,
 * la zona y la categoría no las muestra ninguna tabla, y transportarlas en cada
 * listado obligaría al origen a leer campos que nadie va a mirar. Un listado de
 * mil tickets pesaría por veinte pantallas que no se abren.
 */
export interface TicketDetail extends Ticket {
  /** Dirección de la sucursal donde se atiende el servicio. */
  address: string;

  /** Zona de trabajo a la que pertenece la sucursal (ver PROJECT_CONTEXT.md). */
  zoneName: string;

  categoryName: string;

  /** Pasos del flujo ya completados. De aquí se deriva la acción disponible. */
  completedSteps: TicketWorkflowStep[];
}

/**
 * Qué clase de suceso registra una entrada del timeline.
 *
 * El código viaja en el dato y la etiqueta y el icono son presentación, igual que
 * con los estados: así se puede traducir o repintar sin migrar nada.
 */
export const TICKET_EVENT_KINDS = {
  CREATED: 'creado',
  ASSIGNED: 'asignado',
  STATUS_CHANGED: 'cambio-de-estado',
  PRIORITY_CHANGED: 'cambio-de-prioridad',
  OBSERVATION: 'observacion',
  WORKFLOW: 'paso-de-la-intervencion',
} as const;

export type TicketEventKind = (typeof TICKET_EVENT_KINDS)[keyof typeof TICKET_EVENT_KINDS];

export const TICKET_EVENT_KIND_LABELS: Record<TicketEventKind, string> = {
  creado: 'Creación',
  asignado: 'Asignación',
  'cambio-de-estado': 'Cambio de estado',
  'cambio-de-prioridad': 'Cambio de prioridad',
  observacion: 'Observación',
  'paso-de-la-intervencion': 'Intervención',
};

/**
 * Dónde ocurrió un suceso.
 *
 * **Declarado y sin implementar.** El registro de posición del técnico llegará
 * cuando exista el origen real; se declara ahora para que la forma de una entrada
 * del timeline no cambie al añadirlo. Hoy siempre viaja como null.
 */
export interface TicketEventLocation {
  latitude: number;
  longitude: number;
}

/**
 * Archivo asociado a un suceso: fotografía, firma, informe.
 *
 * **Declarado y sin implementar**, por la misma razón que la posición. Hoy la
 * lista siempre viaja vacía.
 */
export interface TicketEventAttachment {
  id: string;
  fileName: string;
  url: string;
}

/**
 * Una entrada del timeline operativo.
 *
 * Cuenta lo que pasó durante el servicio, en orden y con quién lo hizo. No es lo
 * mismo que la auditoría: aquí van los sucesos de la operación, allí los cambios
 * de un dato. Mezclarlos obliga a leer treinta líneas técnicas para encontrar que
 * el técnico llegó.
 */
export interface TicketEvent {
  id: string;
  kind: TicketEventKind;

  /** Qué pasó, en una línea y en el lenguaje del negocio. */
  description: string;

  /** Quién lo hizo. Nombre para mostrar, nunca para decidir. */
  userName: string;

  occurredAt: string;

  /** Preparado para el registro GPS. Hoy siempre null. */
  location: TicketEventLocation | null;

  /** Preparado para fotografías y archivos. Hoy siempre vacío. */
  attachments: TicketEventAttachment[];
}

/** Campos del ticket cuyos cambios se auditan. */
export const TICKET_AUDIT_FIELDS = {
  STATUS: 'status',
  PRIORITY: 'priority',
  TECHNICIAN: 'technicianName',
} as const;

export type TicketAuditField = (typeof TICKET_AUDIT_FIELDS)[keyof typeof TICKET_AUDIT_FIELDS];

export const TICKET_AUDIT_FIELD_LABELS: Record<TicketAuditField, string> = {
  status: 'Estado',
  priority: 'Prioridad',
  technicianName: 'Técnico',
};

/**
 * Un cambio de un dato del ticket.
 *
 * Guarda el antes y el después completos, no la diferencia, por la misma razón que
 * la auditoría de accesos: reconstruir un valor a partir de diferencias exige que
 * la cadena esté intacta desde el origen (ver docs/ARCHITECTURE.md).
 *
 * Los valores viajan como el código que se almacenó —`en-ruta`, no "En ruta"— para
 * que la traducción siga siendo presentación. Un valor ausente es null: nadie
 * tenía técnico asignado antes de la primera asignación.
 */
export interface TicketFieldChange {
  id: string;
  field: TicketAuditField;
  previousValue: string | null;
  newValue: string | null;
  userName: string;
  changedAt: string;
}

export const assignTechnicianSchema = z.object({
  technicianName: z.string().trim().min(1, 'Elige un técnico'),
});

export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;

export const changeTicketPrioritySchema = z.object({
  priority: z.enum([
    TICKET_PRIORITIES.LOW,
    TICKET_PRIORITIES.MEDIUM,
    TICKET_PRIORITIES.HIGH,
    TICKET_PRIORITIES.CRITICAL,
  ]),
});

export type ChangeTicketPriorityInput = z.infer<typeof changeTicketPrioritySchema>;

export const addTicketObservationSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, 'Escribe la observación')
    .max(500, 'La observación no puede pasar de 500 caracteres'),
});

export type AddTicketObservationInput = z.infer<typeof addTicketObservationSchema>;
