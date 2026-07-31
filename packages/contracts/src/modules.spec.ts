import { describe, expect, it } from 'vitest';
import { isAppModule } from './access-control.js';
import {
  ALL_APP_MODULES,
  APP_MODULES,
  APP_MODULE_DEFINITIONS,
  findAppModule,
  groupPermissionsByAppModule,
  moduleOfPermission,
  permissionActionLabel,
} from './modules.js';
import { ALL_PERMISSIONS, PERMISSIONS } from './permissions.js';

describe('catálogo de módulos', () => {
  it('no repite claves', () => {
    expect(new Set(ALL_APP_MODULES).size).toBe(ALL_APP_MODULES.length);
  });

  it('no repite prefijos de permiso entre módulos', () => {
    // Un prefijo en dos módulos haría que un permiso perteneciera a dos sitios,
    // y el acceso efectivo dependería del orden de la lista.
    const prefixes = APP_MODULE_DEFINITIONS.flatMap((definition) => definition.permissionPrefixes);

    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it('todo módulo tiene etiqueta y descripción', () => {
    for (const definition of APP_MODULE_DEFINITIONS) {
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.description.length).toBeGreaterThan(0);
    }
  });
});

describe('moduleOfPermission', () => {
  it('sitúa cada permiso del catálogo en un módulo', () => {
    // Es la invariante que sostiene la autorización: un permiso que no se puede
    // situar se niega siempre, así que quedaría inservible sin que nadie lo note.
    const unmapped = ALL_PERMISSIONS.filter(
      (permission) => moduleOfPermission(permission) === null,
    );

    expect(unmapped).toEqual([]);
  });

  it('usa el prefijo del permiso cuando coincide con el módulo', () => {
    expect(moduleOfPermission(PERMISSIONS.TICKETS_EDIT)).toBe(APP_MODULES.TICKETS);
  });

  it('sitúa los permisos de roles dentro de Seguridad', () => {
    // El prefijo del permiso y la clave del módulo no siempre coinciden.
    expect(moduleOfPermission(PERMISSIONS.ROLES_EDIT)).toBe(APP_MODULES.SECURITY);
    expect(moduleOfPermission(PERMISSIONS.PERMISSIONS_VIEW)).toBe(APP_MODULES.SECURITY);
    expect(moduleOfPermission(PERMISSIONS.ACTIVITY_LOGS_VIEW)).toBe(APP_MODULES.SECURITY);
  });
});

describe('groupPermissionsByAppModule', () => {
  it('reparte los permisos por módulo', () => {
    const grouped = groupPermissionsByAppModule([
      PERMISSIONS.TICKETS_VIEW,
      PERMISSIONS.TICKETS_EDIT,
      PERMISSIONS.ROLES_VIEW,
    ]);

    expect(grouped.get(APP_MODULES.TICKETS)).toEqual([
      PERMISSIONS.TICKETS_VIEW,
      PERMISSIONS.TICKETS_EDIT,
    ]);
    expect(grouped.get(APP_MODULES.SECURITY)).toEqual([PERMISSIONS.ROLES_VIEW]);
  });

  it('devuelve un mapa vacío sin permisos', () => {
    expect(groupPermissionsByAppModule([]).size).toBe(0);
  });
});

describe('findAppModule', () => {
  it('encuentra un módulo declarado', () => {
    expect(findAppModule(APP_MODULES.SECURITY)?.label).toBe('Seguridad');
  });

  it('no encuentra uno inventado', () => {
    expect(findAppModule('inventado')).toBeUndefined();
  });
});

describe('isAppModule', () => {
  it('reconoce los módulos del catálogo', () => {
    for (const module of ALL_APP_MODULES) {
      expect(isAppModule(module)).toBe(true);
    }
  });

  it('rechaza cualquier otro valor', () => {
    expect(isAppModule('inventado')).toBe(false);
    expect(isAppModule('')).toBe(false);
  });
});

describe('permissionActionLabel', () => {
  it('traduce las acciones conocidas', () => {
    expect(permissionActionLabel(PERMISSIONS.TICKETS_VIEW)).toBe('Ver');
    expect(permissionActionLabel(PERMISSIONS.TICKETS_CREATE)).toBe('Crear');
    expect(permissionActionLabel(PERMISSIONS.TICKETS_DELETE)).toBe('Eliminar');
  });

  it('toda acción del catálogo tiene etiqueta', () => {
    for (const permission of ALL_PERMISSIONS) {
      const action = permission.split('.')[1] ?? '';

      expect(permissionActionLabel(permission)).not.toBe(action.length === 0 ? permission : action);
    }
  });
});
