import type { AppModule, Permission } from '@redsis/contracts';

/**
 * Usuario resuelto por la estrategia JWT y adjuntado a la petición.
 *
 * `roles` está para trazar, no para decidir: la autorización se evalúa sobre
 * `modules` y `permissions`.
 */
export interface RequestUser {
  id: string;
  email: string;
  roles: string[];
  modules: AppModule[];
  permissions: Permission[];
}
