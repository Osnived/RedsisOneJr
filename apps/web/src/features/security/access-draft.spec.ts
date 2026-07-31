/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  APP_MODULES,
  PERMISSIONS,
  type PermissionSummary,
  type RoleSummary,
} from '@redsis/contracts';
import {
  diffAccess,
  draftFromRole,
  hasChanges,
  isEmptyDiff,
  toggleModule,
  togglePermission,
  type AccessDraft,
} from './access-draft';

const CATALOG: PermissionSummary[] = [
  { id: '1', code: PERMISSIONS.TICKETS_VIEW, module: 'tickets', description: null },
  { id: '2', code: PERMISSIONS.TICKETS_EDIT, module: 'tickets', description: null },
  { id: '3', code: PERMISSIONS.USERS_VIEW, module: 'users', description: null },
  { id: '4', code: PERMISSIONS.ROLES_VIEW, module: 'roles', description: null },
];

const ROLE: RoleSummary = {
  id: 'role-1',
  name: 'supervisor',
  description: null,
  isSystem: false,
  isActive: true,
  hasFullAccess: false,
  modules: [APP_MODULES.TICKETS, APP_MODULES.USERS],
  permissions: [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.USERS_VIEW],
  userCount: 2,
};

describe('draftFromRole', () => {
  it('parte de lo que el rol tiene guardado', () => {
    expect(draftFromRole(ROLE)).toEqual({
      modules: [APP_MODULES.TICKETS, APP_MODULES.USERS],
      permissions: [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.USERS_VIEW],
    });
  });

  it('no comparte las listas con el rol', () => {
    const draft = draftFromRole(ROLE);
    draft.modules.push(APP_MODULES.SECURITY);

    expect(ROLE.modules).toHaveLength(2);
  });
});

describe('toggleModule', () => {
  it('concede un módulo', () => {
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.MAPS, true, CATALOG);

    expect(draft.modules).toContain(APP_MODULES.MAPS);
  });

  it('retira un módulo', () => {
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.USERS, false, CATALOG);

    expect(draft.modules).not.toContain(APP_MODULES.USERS);
  });

  it('al retirar un módulo descarta sus permisos', () => {
    // Un permiso sobre un módulo cerrado no concede nada y reaparecería al
    // volver a abrirlo sin que nadie lo pidiera.
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.TICKETS, false, CATALOG);

    expect(draft.permissions).not.toContain(PERMISSIONS.TICKETS_VIEW);
    expect(draft.permissions).toContain(PERMISSIONS.USERS_VIEW);
  });

  it('conceder un módulo no concede sus permisos', () => {
    // Abrir la puerta no es repartir las llaves.
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.MAPS, true, CATALOG);

    expect(draft.permissions).toEqual(ROLE.permissions);
  });

  it('no duplica un módulo que ya estaba', () => {
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.TICKETS, true, CATALOG);

    expect(draft.modules.filter((module) => module === APP_MODULES.TICKETS)).toHaveLength(1);
  });
});

describe('togglePermission', () => {
  it('concede un permiso', () => {
    const draft = togglePermission(draftFromRole(ROLE), PERMISSIONS.TICKETS_EDIT, true);

    expect(draft.permissions).toContain(PERMISSIONS.TICKETS_EDIT);
  });

  it('retira un permiso sin tocar el módulo', () => {
    const draft = togglePermission(draftFromRole(ROLE), PERMISSIONS.TICKETS_VIEW, false);

    expect(draft.permissions).not.toContain(PERMISSIONS.TICKETS_VIEW);
    expect(draft.modules).toContain(APP_MODULES.TICKETS);
  });

  it('conceder un permiso concede el acceso a su módulo', () => {
    // Pedir la acción sin la puerta no significa nada.
    const draft = togglePermission(draftFromRole(ROLE), PERMISSIONS.ROLES_VIEW, true);

    expect(draft.modules).toContain(APP_MODULES.SECURITY);
  });

  it('no duplica el módulo si ya estaba concedido', () => {
    const draft = togglePermission(draftFromRole(ROLE), PERMISSIONS.TICKETS_EDIT, true);

    expect(draft.modules).toEqual(ROLE.modules);
  });
});

describe('hasChanges', () => {
  it('no detecta cambios sobre el estado guardado', () => {
    expect(hasChanges(draftFromRole(ROLE), ROLE)).toBe(false);
  });

  it('ignora el orden en que se marcaron las casillas', () => {
    const reordered: AccessDraft = {
      modules: [APP_MODULES.USERS, APP_MODULES.TICKETS],
      permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.TICKETS_VIEW],
    };

    expect(hasChanges(reordered, ROLE)).toBe(false);
  });

  it('detecta un módulo añadido', () => {
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.MAPS, true, CATALOG);

    expect(hasChanges(draft, ROLE)).toBe(true);
  });

  it('detecta un permiso quitado', () => {
    const draft = togglePermission(draftFromRole(ROLE), PERMISSIONS.USERS_VIEW, false);

    expect(hasChanges(draft, ROLE)).toBe(true);
  });
});

describe('diffAccess', () => {
  it('no encuentra diferencias sin cambios', () => {
    const diff = diffAccess(draftFromRole(ROLE), ROLE);

    expect(isEmptyDiff(diff)).toBe(true);
  });

  it('enumera lo añadido y lo quitado', () => {
    const draft: AccessDraft = {
      modules: [APP_MODULES.TICKETS, APP_MODULES.MAPS],
      permissions: [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.TICKETS_EDIT],
    };

    expect(diffAccess(draft, ROLE)).toEqual({
      addedModules: [APP_MODULES.MAPS],
      removedModules: [APP_MODULES.USERS],
      addedPermissions: [PERMISSIONS.TICKETS_EDIT],
      removedPermissions: [PERMISSIONS.USERS_VIEW],
    });
  });

  it('describe el resultado de retirar un módulo con sus permisos', () => {
    const draft = toggleModule(draftFromRole(ROLE), APP_MODULES.TICKETS, false, CATALOG);
    const diff = diffAccess(draft, ROLE);

    expect(diff.removedModules).toEqual([APP_MODULES.TICKETS]);
    expect(diff.removedPermissions).toEqual([PERMISSIONS.TICKETS_VIEW]);
  });
});
