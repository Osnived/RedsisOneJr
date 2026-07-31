import type { AppModule, Permission } from '@redsis/contracts';

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
export interface UserWithCredentials extends UserWithAccess {
  passwordHash: string;
}

/**
 * Usuario junto con los accesos efectivos que otorgan sus roles activos.
 *
 * `modules` y `permissions` ya vienen resueltos y acumulados: nadie fuera del
 * Provider necesita saber de qué rol viene cada acceso.
 */
export interface UserWithAccess extends UserAccount {
  roles: string[];
  modules: AppModule[];
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
