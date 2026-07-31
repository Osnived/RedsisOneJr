/**
 * Contrato de comprobación del origen de datos.
 *
 * Existe para que el estado del servicio se consulte igual que cualquier otro
 * dato: a través de un Repository. Sin esto, el controlador tendría que inyectar
 * Prisma directamente y sería el único punto del backend que rompe la regla.
 */
export abstract class HealthRepository {
  /** True si el origen de datos responde. */
  abstract isReachable(): Promise<boolean>;
}
