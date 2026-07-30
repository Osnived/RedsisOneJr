import type {
  CreateUserData,
  ListUsersOptions,
  UpdateUserData,
  UserAccount,
  UserWithAccess,
  UserWithCredentials,
} from './user.types';

/**
 * Contrato de acceso a usuarios.
 *
 * Se declara como clase abstracta para que sirva a la vez de contrato y de
 * token de inyección. Los servicios dependen de esta clase; la implementación
 * concreta (PostgreSQL, y en el futuro cualquier otro origen) se resuelve en
 * el módulo. Ningún servicio conoce Prisma.
 */
export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<UserWithCredentials | null>;

  abstract findById(id: string): Promise<UserWithAccess | null>;

  abstract findByIdWithCredentials(id: string): Promise<UserWithCredentials | null>;

  abstract existsByEmail(email: string): Promise<boolean>;

  abstract list(options: ListUsersOptions): Promise<{ items: UserWithAccess[]; total: number }>;

  abstract create(data: CreateUserData): Promise<UserWithAccess>;

  abstract update(id: string, data: UpdateUserData): Promise<UserWithAccess>;

  abstract updatePasswordHash(id: string, passwordHash: string): Promise<void>;

  abstract registerLogin(id: string, occurredAt: Date): Promise<void>;

  abstract deactivate(id: string): Promise<UserAccount>;
}
