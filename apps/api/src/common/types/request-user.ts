import type { Permission } from '@redsis/contracts';

/** Usuario resuelto por la estrategia JWT y adjuntado a la petición. */
export interface RequestUser {
  id: string;
  email: string;
  roles: string[];
  permissions: Permission[];
}
