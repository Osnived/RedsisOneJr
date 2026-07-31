/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { APP_MODULES, PERMISSIONS } from '@redsis/contracts';
import { createAuthorizationService } from './authorization';

/** Un supervisor típico: entra a Tickets y Usuarios, y no a Seguridad. */
function supervisor() {
  return createAuthorizationService({
    modules: [APP_MODULES.TICKETS, APP_MODULES.USERS],
    permissions: [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.TICKETS_EDIT, PERMISSIONS.USERS_VIEW],
  });
}

describe('canAccess', () => {
  it('concede el módulo que el rol tiene', () => {
    expect(supervisor().canAccess(APP_MODULES.TICKETS)).toBe(true);
  });

  it('niega el módulo que el rol no tiene', () => {
    expect(supervisor().canAccess(APP_MODULES.SECURITY)).toBe(false);
  });

  it('niega todo sin sesión', () => {
    const auth = createAuthorizationService({ modules: [], permissions: [] });

    expect(auth.canAccess(APP_MODULES.DASHBOARD)).toBe(false);
  });
});

describe('can', () => {
  it('concede la acción cuando hay permiso y acceso al módulo', () => {
    expect(supervisor().can(PERMISSIONS.TICKETS_EDIT)).toBe(true);
  });

  it('niega la acción cuando falta el permiso', () => {
    expect(supervisor().can(PERMISSIONS.TICKETS_DELETE)).toBe(false);
  });

  it('niega todo sin sesión', () => {
    const auth = createAuthorizationService({ modules: [], permissions: [] });

    expect(auth.can(PERMISSIONS.TICKETS_VIEW)).toBe(false);
  });

  describe('el acceso al módulo manda sobre el permiso', () => {
    it('niega la acción si el rol perdió el módulo', () => {
      // Es el caso que da sentido a las dos puertas: un permiso que sobrevivió a
      // una configuración anterior no debe abrir un módulo ya cerrado.
      const auth = createAuthorizationService({
        modules: [],
        permissions: [PERMISSIONS.TICKETS_VIEW],
      });

      expect(auth.can(PERMISSIONS.TICKETS_VIEW)).toBe(false);
    });

    it('no concede nada por tener el módulo sin el permiso', () => {
      const auth = createAuthorizationService({
        modules: [APP_MODULES.TICKETS],
        permissions: [],
      });

      expect(auth.can(PERMISSIONS.TICKETS_VIEW)).toBe(false);
    });
  });

  describe('permisos cuyo prefijo no es el nombre de su módulo', () => {
    it('sitúa roles.view dentro de Seguridad', () => {
      const auth = createAuthorizationService({
        modules: [APP_MODULES.SECURITY],
        permissions: [PERMISSIONS.ROLES_VIEW],
      });

      expect(auth.can(PERMISSIONS.ROLES_VIEW)).toBe(true);
    });

    it('niega roles.view a quien no entra a Seguridad', () => {
      const auth = createAuthorizationService({
        modules: [APP_MODULES.USERS],
        permissions: [PERMISSIONS.ROLES_VIEW],
      });

      expect(auth.can(PERMISSIONS.ROLES_VIEW)).toBe(false);
    });
  });
});

describe('canAny', () => {
  it('basta con uno de los permisos', () => {
    expect(supervisor().canAny([PERMISSIONS.TICKETS_DELETE, PERMISSIONS.USERS_VIEW])).toBe(true);
  });

  it('falla si no tiene ninguno', () => {
    expect(supervisor().canAny([PERMISSIONS.TICKETS_DELETE, PERMISSIONS.USERS_DELETE])).toBe(false);
  });

  it('con lista vacía no concede acceso', () => {
    expect(supervisor().canAny([])).toBe(false);
  });

  it('respeta el acceso al módulo igual que can', () => {
    const auth = createAuthorizationService({
      modules: [],
      permissions: [PERMISSIONS.TICKETS_VIEW],
    });

    expect(auth.canAny([PERMISSIONS.TICKETS_VIEW])).toBe(false);
  });
});
