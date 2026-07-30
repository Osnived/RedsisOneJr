import type { Permission } from '@redsis/contracts';

/**
 * Representación de dominio de un usuario.
 *
 * Los Repositories devuelven estos tipos, nunca modelos de Prisma: así el
 * dominio no queda atado al origen de datos y se puede sustituir PostgreSQL
 * sin tocar los servicios (ver AGENTS.md).
 */
export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** Usuario junto con sus credenciales. Solo lo usa el flujo de autenticación. */
export interface UserWithCredentials extends UserAccount {
  passwordHash: string;
  roles: string[];
  permissions: Permission[];
}

/** Usuario junto con los accesos efectivos que otorgan sus roles. */
export interface UserWithAccess extends UserAccount {
  roles: string[];
  permissions: Permission[];
}

export interface CreateUserData {
  email: string;
  fullName: string;
  passwordHash: string;
  roleIds: string[];
}

export interface UpdateUserData {
  fullName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface ListUsersOptions {
  skip: number;
  take: number;
}
