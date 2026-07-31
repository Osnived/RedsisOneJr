import type { AppModule } from './modules.js';
import type { Permission } from './permissions.js';

/**
 * Rol tal como lo entrega la API y lo consume el frontend.
 *
 * Un Rol únicamente agrupa accesos: no otorga nada por sí mismo. La autorización
 * siempre se evalúa sobre el acceso resultante, nunca sobre el nombre del rol.
 *
 * El acceso tiene dos niveles y los dos viven aquí:
 *
 * - `modules` decide qué módulos existen para el rol. Sin acceso al módulo, sus
 *   permisos no se evalúan: la puerta está cerrada antes de mirar la cerradura.
 * - `permissions` decide qué acciones puede ejecutar dentro de esos módulos.
 */
export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;

  /** Los roles del sistema los crea la semilla y no deben eliminarse. */
  isSystem: boolean;

  /** Un rol desactivado conserva su configuración y deja de conceder acceso. */
  isActive: boolean;

  /**
   * Concede todo lo que exista, ahora y en el futuro.
   *
   * Su acceso se calcula en lugar de almacenarse, así que `modules` y
   * `permissions` llegan completos y un módulo nuevo aparece sin migrar nada. Es
   * la garantía de que la administración de la plataforma no se puede quedar
   * fuera por una configuración incompleta, y por eso su acceso no se edita.
   */
  hasFullAccess: boolean;

  modules: AppModule[];

  permissions: Permission[];

  /** Cuántos usuarios tienen el rol asignado. */
  userCount: number;
}
