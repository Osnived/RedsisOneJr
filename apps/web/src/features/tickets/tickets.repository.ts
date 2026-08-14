import type {
  AddTicketObservationInput,
  AssignTechnicianInput,
  ChangeTicketPriorityInput,
  DataQuery,
  PaginatedResult,
  Ticket,
  TicketColumnConfig,
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Contrato de acceso a los datos de Tickets desde el frontend.
 *
 * Es lo único que conocen los hooks del módulo, y por tanto lo único de lo que
 * depende la pantalla. Enumera **qué** se puede pedir y no **de dónde** sale: ni
 * URLs, ni tableros, ni paginación de ningún proveedor.
 *
 * Detrás vive un proveedor que llama a la API de NestJS, y ahí termina el
 * conocimiento del frontend: qué origen atiende esa API —el simulado, RedsisOne,
 * Baserow o ServiceNow— React no lo sabe ni puede saberlo.
 *
 * **El actor ya no viaja como parámetro.** Lo toma el backend del token: el
 * frontend no debe poder decir quién hizo algo, que es la diferencia entre una
 * auditoría y un campo de texto.
 */
export interface TicketRepository {
  /**
   * Página de tickets para localizar uno.
   *
   * Recibe la consulta completa y devuelve el total existente, no solo la página:
   * sin ese total la tabla no puede dibujar su paginación.
   */
  list(query: DataQuery): Promise<PaginatedResult<Ticket>>;

  /**
   * Estructura de columnas del proyecto.
   *
   * Se pide al origen en lugar de declararse en el código porque cada proyecto
   * tiene la suya. Llega ya normalizada: sin identificadores del proveedor.
   */
  describeColumns(): Promise<TicketColumnConfig[]>;

  /** El ticket completo. Lanza si el identificador no corresponde a ninguno. */
  findDetail(ticketId: string): Promise<TicketDetail>;

  findTimeline(ticketId: string): Promise<TicketEvent[]>;

  findAuditLog(ticketId: string): Promise<TicketFieldChange[]>;

  /**
   * Técnicos a los que se puede asignar un servicio.
   *
   * Está aquí y no en un Repository propio porque Técnicos todavía no es un módulo
   * (ver PROJECT_STATUS.md). Cuando exista, esta consulta se mudará allí y el
   * formulario de asignación seguirá pidiendo lo mismo: la lista de candidatos.
   */
  listAssignableTechnicians(): Promise<string[]>;

  assignTechnician(ticketId: string, input: AssignTechnicianInput): Promise<TicketDetail>;

  changePriority(ticketId: string, input: ChangeTicketPriorityInput): Promise<TicketDetail>;

  addObservation(ticketId: string, input: AddTicketObservationInput): Promise<TicketDetail>;

  /** Avanza el flujo. El backend decide si el paso es válido, no quien lo pide. */
  completeWorkflowStep(ticketId: string, step: TicketWorkflowStep): Promise<TicketDetail>;
}
