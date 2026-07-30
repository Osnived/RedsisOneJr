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

/**
 * Módulos declarados. Cada módulo es una unidad funcional independiente
 * y agrupa sus propios permisos.
 */
export const MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  DASHBOARD: 'dashboard',
  TICKETS: 'tickets',
  MAPS: 'maps',
  ACTIVITY_LOGS: 'activity-logs',
  SETTINGS: 'settings',
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

/** Extrae el módulo al que pertenece un permiso. */
export function getPermissionModule(permission: Permission): string {
  const [module] = permission.split('.');
  return module ?? '';
}

/** Agrupa una lista de permisos por módulo. */
export function groupPermissionsByModule(
  permissions: readonly Permission[],
): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  for (const permission of permissions) {
    const module = getPermissionModule(permission);
    const bucket = grouped[module];
    if (bucket) {
      bucket.push(permission);
    } else {
      grouped[module] = [permission];
    }
  }
  return grouped;
}

/** Roles semilla del sistema. Los nombres pueden cambiar; el conjunto de permisos es lo importante. */
export const SYSTEM_ROLES = {
  ADMINISTRATOR: 'administrador',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'tecnico',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
