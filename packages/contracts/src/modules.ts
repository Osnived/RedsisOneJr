import { getPermissionModule, type Permission } from './permissions.js';

/**
 * Catálogo de módulos de la plataforma.
 *
 * Un módulo es una unidad funcional independiente (ver PROJECT_CONTEXT.md) y es
 * la pieza sobre la que se concede o se retira el acceso de un rol.
 *
 * Se declaran también los módulos que todavía no tienen pantalla: así conceder
 * acceso a Clientes antes de que Clientes exista es posible, y cuando llegue no
 * hay que revisar los roles ya guardados ni tocar la pantalla de Seguridad.
 */
export const APP_MODULES = {
  DASHBOARD: 'dashboard',
  TICKETS: 'tickets',
  TECHNICIANS: 'technicians',
  FORMS: 'forms',
  CLIENTS: 'clients',
  BRANCHES: 'branches',
  MAPS: 'maps',
  REPORTS: 'reports',
  USERS: 'users',
  SETTINGS: 'settings',
  SECURITY: 'security',
} as const;

export type AppModule = (typeof APP_MODULES)[keyof typeof APP_MODULES];

/**
 * Qué es cada módulo.
 *
 * `permissionPrefixes` es lo que une este catálogo con el de permisos: un
 * permiso `roles.edit` pertenece al módulo Seguridad aunque su código empiece
 * por `roles`. Sin este mapa habría que renombrar permisos ya almacenados.
 *
 * `route` es nulo mientras el módulo no tenga pantalla. El menú solo dibuja los
 * que la tienen, aunque el rol tenga acceso concedido a los demás.
 */
export interface AppModuleDefinition {
  key: AppModule;
  label: string;
  description: string;
  permissionPrefixes: readonly string[];
  route: string | null;
}

export const APP_MODULE_DEFINITIONS: readonly AppModuleDefinition[] = [
  {
    key: APP_MODULES.DASHBOARD,
    label: 'Panel',
    description: 'Indicadores y resumen de la operación',
    permissionPrefixes: ['dashboard'],
    route: '/',
  },
  {
    key: APP_MODULES.TICKETS,
    label: 'Tickets',
    description: 'Servicios e incidentes',
    permissionPrefixes: ['tickets'],
    route: '/tickets',
  },
  {
    key: APP_MODULES.TECHNICIANS,
    label: 'Técnicos',
    description: 'Personal de campo y sus asignaciones',
    permissionPrefixes: ['technicians'],
    route: null,
  },
  {
    key: APP_MODULES.FORMS,
    label: 'Formularios',
    description: 'Plantillas de captura en sitio',
    permissionPrefixes: ['forms'],
    route: null,
  },
  {
    key: APP_MODULES.CLIENTS,
    label: 'Clientes',
    description: 'Empresas atendidas',
    permissionPrefixes: ['clients'],
    route: null,
  },
  {
    key: APP_MODULES.BRANCHES,
    label: 'Sucursales',
    description: 'Lugares físicos de atención y zonas de trabajo',
    permissionPrefixes: ['branches', 'zones'],
    route: null,
  },
  {
    key: APP_MODULES.MAPS,
    label: 'Mapas',
    description: 'Ubicación de servicios y sucursales',
    permissionPrefixes: ['maps'],
    route: null,
  },
  {
    key: APP_MODULES.REPORTS,
    label: 'Reportes',
    description: 'Informes y exportaciones',
    permissionPrefixes: ['reports'],
    route: null,
  },
  {
    key: APP_MODULES.USERS,
    label: 'Usuarios',
    description: 'Personas autorizadas para entrar a la plataforma',
    permissionPrefixes: ['users'],
    route: '/users',
  },
  {
    key: APP_MODULES.SETTINGS,
    label: 'Configuración',
    description: 'Ajustes de la plataforma',
    permissionPrefixes: ['settings'],
    route: null,
  },
  {
    key: APP_MODULES.SECURITY,
    label: 'Seguridad',
    description: 'Roles, acceso a módulos, permisos y auditoría',
    permissionPrefixes: ['roles', 'permissions', 'activity-logs'],
    route: '/security',
  },
];

export const ALL_APP_MODULES: readonly AppModule[] = APP_MODULE_DEFINITIONS.map(
  (definition) => definition.key,
);

/** Módulos que ya tienen pantalla. Son los únicos que puede dibujar el menú. */
export const IMPLEMENTED_APP_MODULES: readonly AppModule[] = APP_MODULE_DEFINITIONS.filter(
  (definition) => definition.route !== null,
).map((definition) => definition.key);

export function findAppModule(key: string): AppModuleDefinition | undefined {
  return APP_MODULE_DEFINITIONS.find((definition) => definition.key === key);
}

/**
 * Módulo al que pertenece un permiso.
 *
 * Devuelve null si el prefijo no está mapeado. Ocurre con un permiso nuevo cuyo
 * módulo nadie declaró todavía, y es mejor saberlo que asignarlo por descarte a
 * un módulo cualquiera.
 */
export function moduleOfPermission(permission: Permission): AppModule | null {
  const prefix = getPermissionModule(permission);
  const definition = APP_MODULE_DEFINITIONS.find((candidate) =>
    candidate.permissionPrefixes.includes(prefix),
  );

  return definition?.key ?? null;
}

/**
 * Reparte una lista de permisos entre los módulos a los que pertenecen.
 *
 * Es lo que permite que la pantalla de Seguridad muestre los permisos agrupados
 * sin saber nada del catálogo: pide el reparto y dibuja lo que recibe. Añadir un
 * permiso al módulo correcto no exige tocar la pantalla.
 */
export function groupPermissionsByAppModule(
  permissions: readonly Permission[],
): Map<AppModule, Permission[]> {
  const grouped = new Map<AppModule, Permission[]>();

  for (const permission of permissions) {
    const module = moduleOfPermission(permission);

    if (module === null) {
      continue;
    }

    const bucket = grouped.get(module);

    if (bucket) {
      bucket.push(permission);
    } else {
      grouped.set(module, [permission]);
    }
  }

  return grouped;
}

/**
 * Etiqueta legible de una acción de permiso.
 *
 * La pantalla muestra "Ver" y no "view". Vive en los contratos porque el mismo
 * texto lo necesitan la interfaz y cualquier informe que se genere en el backend.
 */
export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  assign: 'Asignar',
  export: 'Exportar',
  suspend: 'Suspender',
};

/** Acción de un permiso, ya legible. Si no está mapeada se muestra tal cual. */
export function permissionActionLabel(permission: Permission): string {
  const action = permission.split('.')[1] ?? permission;

  return PERMISSION_ACTION_LABELS[action] ?? action;
}
