import type { Permission } from './permissions.js';

/**
 * Rol tal como lo entrega la API y lo consume el frontend.
 *
 * Un Rol únicamente agrupa permisos: no otorga acceso por sí mismo. La
 * autorización siempre se evalúa sobre los permisos resultantes.
 */
export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;

  /** Los roles del sistema los crea la semilla y no deben eliminarse. */
  isSystem: boolean;

  permissions: Permission[];

  /** Cuántos usuarios tienen el rol asignado. */
  userCount: number;
}
