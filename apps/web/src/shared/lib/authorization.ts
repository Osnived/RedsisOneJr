import { moduleOfPermission, type AppModule, type Permission } from '@redsis/contracts';

/**
 * Accesos efectivos de quien está usando la aplicación.
 *
 * Es lo único que hace falta para decidir. No incluye el nombre del rol a
 * propósito: si estuviera aquí, alguien acabaría comparándolo.
 */
export interface EffectiveAccess {
  modules: readonly string[];
  permissions: readonly string[];
}

/**
 * Servicio de autorización.
 *
 * Es la única vía por la que la aplicación pregunta si algo está permitido.
 * Ningún componente, hook o ruta consulta `user.permissions` ni compara nombres
 * de rol: eso ataría cada pantalla a cómo se calculan los accesos hoy, y
 * cambiarlo obligaría a revisarlas todas.
 *
 * Las dos preguntas son distintas y las dos hacen falta:
 *
 * - `canAccess('tickets')` — ¿existe el módulo para este usuario?
 * - `can('tickets.edit')` — ¿puede ejecutar esta acción?
 *
 * Un permiso sin acceso al módulo no sirve de nada, así que `can` lo comprueba
 * también. Es lo que evita que un permiso heredado de una configuración anterior
 * abra una puerta que ya se cerró.
 */
export interface AuthorizationService {
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAccess: (module: AppModule) => boolean;
}

/**
 * Construye el servicio a partir de los accesos efectivos.
 *
 * Es una función pura: recibe los accesos y devuelve las respuestas. Así la
 * regla se prueba sin montar componentes ni simular una sesión, y el día que
 * entren el alcance o la vigencia se cambia aquí y en ningún otro sitio.
 */
export function createAuthorizationService(access: EffectiveAccess): AuthorizationService {
  const modules = new Set(access.modules);
  const permissions = new Set(access.permissions);

  function canAccess(module: AppModule): boolean {
    return modules.has(module);
  }

  function can(permission: Permission): boolean {
    if (!permissions.has(permission)) {
      return false;
    }

    // El módulo se resuelve por el prefijo declarado en el catálogo, no por la
    // primera parte del código: `roles.edit` pertenece a Seguridad.
    const module = moduleOfPermission(permission);

    // Un permiso cuyo módulo nadie declaró no se puede situar, y en una decisión
    // de autorización lo que no se puede situar se niega.
    return module !== null && canAccess(module);
  }

  return {
    can,
    canAny: (candidates) => candidates.some((permission) => can(permission)),
    canAccess,
  };
}
