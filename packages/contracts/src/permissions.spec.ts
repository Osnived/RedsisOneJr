import { describe, expect, it } from 'vitest';
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  getPermissionModule,
  groupPermissionsByModule,
} from './permissions.js';

describe('catálogo de permisos', () => {
  it('no contiene códigos duplicados', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  it('todos los códigos siguen la convención modulo.accion', () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(permission).toMatch(/^[a-z-]+\.[a-z-]+$/);
    }
  });
});

describe('getPermissionModule', () => {
  it('extrae el módulo del código', () => {
    expect(getPermissionModule(PERMISSIONS.USERS_CREATE)).toBe('users');
  });

  it('funciona con módulos compuestos', () => {
    expect(getPermissionModule(PERMISSIONS.ACTIVITY_LOGS_VIEW)).toBe('activity-logs');
  });
});

describe('groupPermissionsByModule', () => {
  it('agrupa los permisos por su módulo', () => {
    const grouped = groupPermissionsByModule([
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.DASHBOARD_VIEW,
    ]);

    expect(grouped['users']).toEqual([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE]);
    expect(grouped['dashboard']).toEqual([PERMISSIONS.DASHBOARD_VIEW]);
  });

  it('devuelve un objeto vacío sin permisos', () => {
    expect(groupPermissionsByModule([])).toEqual({});
  });

  it('cubre todos los módulos del catálogo completo', () => {
    const grouped = groupPermissionsByModule(ALL_PERMISSIONS);

    const total = Object.values(grouped).reduce((sum, items) => sum + items.length, 0);
    expect(total).toBe(ALL_PERMISSIONS.length);
  });
});
