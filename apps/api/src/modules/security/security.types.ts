import type { AppModule, Permission } from '@redsis/contracts';

/**
 * Conjunto de accesos de un rol.
 *
 * Es lo que se guarda y lo que se audita: los dos niveles juntos, porque un
 * cambio de acceso casi nunca toca solo uno.
 */
export interface RoleAccessState {
  modules: AppModule[];
  permissions: Permission[];
}

export interface CreateRoleData {
  name: string;
  description: string | null;
}

export interface UpdateRoleData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

/** Datos de un cambio de acceso, ya validados, listos para persistir y auditar. */
export interface RoleAccessChange {
  roleId: string;
  /** Quién lo hizo. Nulo solo si el cambio no viene de una persona. */
  userId: string | null;
  reason: string;
  previous: RoleAccessState;
  next: RoleAccessState;
}
