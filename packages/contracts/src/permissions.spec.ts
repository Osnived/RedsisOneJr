import { describe, expect, it } from 'vitest';
import { ALL_PERMISSIONS, PERMISSIONS, getPermissionModule } from './permissions.js';

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
