import {
  moduleOfPermission,
  type AppModule,
  type Permission,
  type PermissionSummary,
  type RoleSummary,
} from '@redsis/contracts';

/**
 * Accesos que el usuario está editando, antes de guardarlos.
 *
 * Vive en la pantalla y no en el servidor: hasta que se confirma el cambio con
 * su motivo, nada se persiste. Eso es lo que permite revisar lo que se va a
 * hacer antes de hacerlo.
 */
export interface AccessDraft {
  modules: AppModule[];
  permissions: Permission[];
}

export function draftFromRole(role: RoleSummary): AccessDraft {
  return { modules: [...role.modules], permissions: [...role.permissions] };
}

/**
 * Concede o retira un módulo.
 *
 * Al retirarlo se descartan también sus permisos. Conservarlos dejaría al rol
 * con permisos sobre un módulo al que no entra: no conceden nada y reaparecerían
 * al volver a dar acceso, sin que nadie lo hubiera pedido.
 */
export function toggleModule(
  draft: AccessDraft,
  module: AppModule,
  isGranted: boolean,
  catalog: readonly PermissionSummary[],
): AccessDraft {
  if (isGranted) {
    return {
      modules: sorted([...draft.modules, module]),
      permissions: draft.permissions,
    };
  }

  const dropped = new Set(
    catalog
      .filter((permission) => moduleOfPermission(permission.code) === module)
      .map((permission) => permission.code),
  );

  return {
    modules: draft.modules.filter((candidate) => candidate !== module),
    permissions: draft.permissions.filter((permission) => !dropped.has(permission)),
  };
}

/**
 * Concede o retira un permiso.
 *
 * Conceder un permiso concede también el acceso a su módulo: pedir la acción sin
 * la puerta no significa nada, y obligar a marcar las dos casillas por separado
 * solo produce configuraciones a medias.
 */
export function togglePermission(
  draft: AccessDraft,
  permission: Permission,
  isGranted: boolean,
): AccessDraft {
  if (!isGranted) {
    return {
      modules: draft.modules,
      permissions: draft.permissions.filter((candidate) => candidate !== permission),
    };
  }

  const module = moduleOfPermission(permission);
  const needsModule = module !== null && !draft.modules.includes(module);

  return {
    modules: needsModule && module !== null ? sorted([...draft.modules, module]) : draft.modules,
    permissions: sorted([...draft.permissions, permission]),
  };
}

/** Si el borrador difiere de lo guardado. Es lo que habilita el botón de guardar. */
export function hasChanges(draft: AccessDraft, role: RoleSummary): boolean {
  return !sameSet(draft.modules, role.modules) || !sameSet(draft.permissions, role.permissions);
}

/**
 * Qué cambia respecto a lo guardado.
 *
 * Se muestra en el modal de confirmación: quien escribe el motivo tiene que ver
 * exactamente lo que está a punto de firmar.
 */
export interface AccessDiff {
  addedModules: AppModule[];
  removedModules: AppModule[];
  addedPermissions: Permission[];
  removedPermissions: Permission[];
}

export function diffAccess(draft: AccessDraft, role: RoleSummary): AccessDiff {
  return {
    addedModules: missingFrom(draft.modules, role.modules),
    removedModules: missingFrom(role.modules, draft.modules),
    addedPermissions: missingFrom(draft.permissions, role.permissions),
    removedPermissions: missingFrom(role.permissions, draft.permissions),
  };
}

export function isEmptyDiff(diff: AccessDiff): boolean {
  return (
    diff.addedModules.length === 0 &&
    diff.removedModules.length === 0 &&
    diff.addedPermissions.length === 0 &&
    diff.removedPermissions.length === 0
  );
}

function missingFrom<TValue>(values: TValue[], reference: TValue[]): TValue[] {
  const known = new Set(reference);

  return values.filter((value) => !known.has(value));
}

/**
 * Se compara como conjunto y no como lista: el orden en el que alguien marca las
 * casillas no es un cambio.
 */
function sameSet<TValue>(first: TValue[], second: TValue[]): boolean {
  if (first.length !== second.length) {
    return false;
  }

  const known = new Set(second);

  return first.every((value) => known.has(value));
}

function sorted<TValue extends string>(values: TValue[]): TValue[] {
  return [...new Set(values)].sort();
}
