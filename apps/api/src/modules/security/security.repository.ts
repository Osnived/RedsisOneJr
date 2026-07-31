import type { RoleAccessAuditEntry, RoleSummary } from '@redsis/contracts';
import type {
  CreateRoleData,
  RoleAccessChange,
  RoleAccessState,
  UpdateRoleData,
} from './security.types';

/**
 * Contrato de acceso a la administración de seguridad.
 *
 * Devuelve tipos de `@redsis/contracts` y no modelos de Prisma: es lo que impide
 * que el dominio quede atado al origen de datos (ver AGENTS.md).
 *
 * El cambio de accesos es un solo método y no tres, porque guardar módulos,
 * guardar permisos y registrar la auditoría tienen que ocurrir juntos o no
 * ocurrir. Partirlo dejaría la puerta abierta a un cambio sin rastro.
 */
export abstract class SecurityRepository {
  abstract listRoles(): Promise<RoleSummary[]>;

  abstract findRoleById(id: string): Promise<RoleSummary | null>;

  abstract findRoleByName(name: string): Promise<RoleSummary | null>;

  abstract createRole(data: CreateRoleData): Promise<RoleSummary>;

  abstract updateRole(id: string, data: UpdateRoleData): Promise<RoleSummary>;

  /** Accesos actuales de un rol. Es el "antes" que se guarda en la auditoría. */
  abstract findRoleAccess(id: string): Promise<RoleAccessState | null>;

  /** Reemplaza los accesos y registra el cambio en la misma transacción. */
  abstract replaceRoleAccess(change: RoleAccessChange): Promise<RoleSummary>;

  abstract listAccessAudit(roleId: string): Promise<RoleAccessAuditEntry[]>;
}
