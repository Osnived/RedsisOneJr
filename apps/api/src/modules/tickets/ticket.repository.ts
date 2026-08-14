import type { DataQuery, TicketColumnConfig } from '@redsis/contracts';
import type {
  TicketDetail,
  TicketEvent,
  TicketFieldChange,
  TicketMutation,
  TicketPage,
} from './ticket.types';

/**
 * Contrato de acceso a los datos de Tickets.
 *
 * Se declara como clase abstracta para que sirva a la vez de contrato y de token
 * de inyección, igual que `UserRepository`. La diferencia es que aquí la
 * implementación **no se fija al arrancar**: cada fuente de datos configurada
 * puede tener un proveedor distinto, así que quien la resuelve es
 * `TicketProviderRegistry`.
 *
 * Enumera **qué** se puede pedir y no **de dónde** sale. Ningún método menciona
 * tableros, columnas de RedsisOne, tablas de Baserow ni paginación de nadie: eso
 * lo traduce cada Provider.
 *
 * Ninguna regla de negocio vive por debajo de esta frontera. Qué estado sigue a
 * qué paso, qué se audita y qué entra en el timeline lo decide `TicketsService`;
 * un Provider solo persiste lo que recibe.
 */
export abstract class TicketRepository {
  /**
   * Página de tickets para localizar uno.
   *
   * Recibe la consulta completa —página, orden, búsqueda y filtros— porque un
   * origen externo puede resolverla en el servidor. El que no sepa la resuelve en
   * memoria sobre lo que haya traído, y quien llama no nota la diferencia.
   */
  abstract list(query: DataQuery): Promise<TicketPage>;

  /** El ticket completo, o null si el identificador no corresponde a ninguno. */
  abstract findDetail(ticketId: string): Promise<TicketDetail | null>;

  abstract findTimeline(ticketId: string): Promise<TicketEvent[] | null>;

  abstract findAuditLog(ticketId: string): Promise<TicketFieldChange[] | null>;

  /**
   * Estructura de columnas de esta fuente.
   *
   * La entrega el Provider porque cada proyecto tiene la suya: un tablero de
   * RedsisOne declara sus columnas y otro declara otras. El que no sepa
   * describirse devuelve las estándar.
   */
  abstract describeColumns(): Promise<TicketColumnConfig[]>;

  /**
   * Técnicos a los que se puede asignar un servicio.
   *
   * Está aquí y no en un Repository propio porque Técnicos todavía no es un módulo
   * (ver PROJECT_STATUS.md). Cuando exista, esta consulta se muda allí.
   */
  abstract listAssignableTechnicians(): Promise<string[]>;

  /**
   * Aplica un cambio ya resuelto y devuelve el ticket actualizado.
   *
   * Es una sola operación y no tres para que el dato, el timeline y la auditoría
   * no puedan quedar en desacuerdo. Devuelve null si el ticket no existe.
   */
  abstract applyMutation(ticketId: string, mutation: TicketMutation): Promise<TicketDetail | null>;
}
