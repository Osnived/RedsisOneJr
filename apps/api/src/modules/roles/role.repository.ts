import type { RoleSummary } from '@redsis/contracts';

/**
 * Contrato de acceso a roles.
 *
 * Devuelve `RoleSummary` de @redsis/contracts y no un tipo propio: así el
 * frontend y el backend describen el rol una sola vez y no pueden desviarse.
 */
export abstract class RoleRepository {
  abstract list(): Promise<RoleSummary[]>;

  abstract findById(id: string): Promise<RoleSummary | null>;
}
