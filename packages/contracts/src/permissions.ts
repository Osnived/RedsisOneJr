/**
 * Catálogo oficial de permisos de la plataforma.
 *
 * Los permisos son la unidad mínima de autorización (ver PROJECT_CONTEXT.md).
 * La autorización nunca se basa únicamente en roles: los roles agrupan permisos.
 *
 * Convención de nombre: `<modulo>.<accion>`
 */
export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',

  PERMISSIONS_VIEW: 'permissions.view',

  DASHBOARD_VIEW: 'dashboard.view',

  TICKETS_VIEW: 'tickets.view',
  TICKETS_CREATE: 'tickets.create',
  TICKETS_EDIT: 'tickets.edit',
  TICKETS_DELETE: 'tickets.delete',

  MAPS_VIEW: 'maps.view',

  ACTIVITY_LOGS_VIEW: 'activity-logs.view',

  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

/** Extrae el módulo al que pertenece un permiso. */
export function getPermissionModule(permission: Permission): string {
  const [module] = permission.split('.');
  return module ?? '';
}

/**
 * Permiso tal como lo entrega la API.
 *
 * El catálogo vive en la base de datos además de en este archivo: la constante
 * `PERMISSIONS` es la referencia para el código, y la tabla es lo que permite
 * asignarlos a roles sin desplegar.
 */
export interface PermissionSummary {
  id: string;
  code: Permission;
  module: string;
  description: string | null;
}

/** Roles semilla del sistema. Los nombres pueden cambiar; el conjunto de permisos es lo importante. */
export const SYSTEM_ROLES = {
  ADMINISTRATOR: 'administrador',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'tecnico',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
