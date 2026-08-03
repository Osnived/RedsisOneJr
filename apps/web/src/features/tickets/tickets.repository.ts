import type {
  AddTicketObservationInput,
  AssignTechnicianInput,
  ChangeTicketPriorityInput,
  Ticket,
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketWorkflowStep,
} from '@redsis/contracts';

/**
 * Contrato de acceso a los datos de Tickets.
 *
 * Es lo único que conocen los hooks del módulo, y por tanto lo único de lo que
 * depende la pantalla. Enumera **qué** se puede pedir y no **de dónde** sale: ni
 * URLs, ni tablas, ni paginación de ningún proveedor.
 *
 * Cambiar de origen es escribir otra implementación de esta interfaz y cambiar la
 * línea que la elige (ver `ticket-repository.ts`). Nada más: ni las secciones del
 * espacio de trabajo, ni el framework de tablas, ni las consultas de React Query.
 *
 * Es la misma forma que tendrá el Repository de NestJS cuando Tickets tenga
 * backend. Entonces el proveedor de este lado será uno que llame a la API, y las
 * reglas y el acceso a Baserow vivirán donde manda la arquitectura (ver AGENTS.md).
 *
 * El actor de las operaciones viaja como parámetro solo mientras el origen sea
 * simulado: un backend lo toma del token, porque el frontend no debe poder decir
 * quién hizo algo.
 */
export interface TicketRepository {
  /** Tickets para localizar uno. Sin los campos que solo usa el detalle. */
  list(options?: { shouldFail?: boolean }): Promise<Ticket[]>;

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
   *
   * Viajan como nombres porque es lo que `Ticket` almacena hoy. Cuando haya módulo
   * de Técnicos serán identificadores.
   */
  listAssignableTechnicians(): Promise<string[]>;

  assignTechnician(
    ticketId: string,
    input: AssignTechnicianInput,
    actor: string,
  ): Promise<TicketDetail>;

  changePriority(
    ticketId: string,
    input: ChangeTicketPriorityInput,
    actor: string,
  ): Promise<TicketDetail>;

  addObservation(
    ticketId: string,
    input: AddTicketObservationInput,
    actor: string,
  ): Promise<TicketDetail>;

  /** Avanza el flujo. El origen decide si el paso es válido, no quien lo pide. */
  completeWorkflowStep(
    ticketId: string,
    step: TicketWorkflowStep,
    actor: string,
  ): Promise<TicketDetail>;
}
