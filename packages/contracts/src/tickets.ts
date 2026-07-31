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
