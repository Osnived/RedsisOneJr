import { z } from 'zod';
import { APP_MODULE_DEFINITIONS, type AppModule, type AppModuleDefinition } from './modules.js';
import { ALL_PERMISSIONS, type Permission, type PermissionSummary } from './permissions.js';

/**
 * Lo que hace falta para dibujar la administración de accesos.
 *
 * Los dos catálogos viajan juntos porque por separado no significan nada: un
 * permiso sin su módulo no se sabe dónde colocarlo.
 */
export interface AccessCatalog {
  modules: readonly AppModuleDefinition[];
  permissions: PermissionSummary[];
}

/**
 * Comprobaciones de catálogo.
 *
 * Se recorren las listas declaradas en lugar de afirmar el tipo: así un valor
 * inventado nunca entra al dominio por una aserción, que es precisamente lo que
 * hay que evitar en una superficie de autorización.
 */
export function isAppModule(value: string): value is AppModule {
  return APP_MODULE_DEFINITIONS.some((definition) => definition.key === value);
}

export function isPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.some((permission) => permission === value);
}

/**
 * Comprobaciones de lista completa para los esquemas.
 *
 * El tipo de retorno se declara `boolean` a propósito. TypeScript deduce
 * predicados de tipo cuando una función solo delega en otro predicado, y eso
 * haría que el esquema entregase `AppModule[]` en lugar de `string[]`: el DTO
 * que valida la entrada tendría entonces que declarar el tipo estrecho, es decir
 * afirmar como cierto justo lo que está a punto de comprobar.
 */
function areKnownModules(values: string[]): boolean {
  return values.every((value) => isAppModule(value));
}

function areKnownPermissions(values: string[]): boolean {
  return values.every((value) => isPermission(value));
}

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede pasar de 50 caracteres'),
  description: z
    .string()
    .trim()
    .max(200, 'La descripción no puede pasar de 200 caracteres')
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

/** Longitud máxima del motivo. Suficiente para explicar un cambio sin ser un informe. */
export const ACCESS_CHANGE_REASON_MAX = 500;

/**
 * Cambio de acceso de un rol.
 *
 * El motivo es obligatorio y no tiene valor por defecto: un cambio de permisos
 * sin explicación deja una auditoría que no sirve para auditar. La regla vive en
 * el contrato para que la exijan por igual la pantalla y la API.
 *
 * Se envían los conjuntos completos y no las diferencias: así el servidor puede
 * registrar el antes y el después sin reconstruirlos, y dos personas editando a
 * la vez no producen un estado que nadie pidió.
 */
export const updateRoleAccessSchema = z.object({
  modules: z.array(z.string()).refine(areKnownModules, {
    message: 'Hay módulos que no existen en el catálogo',
  }),
  permissions: z.array(z.string()).refine(areKnownPermissions, {
    message: 'Hay permisos que no existen en el catálogo',
  }),
  reason: z
    .string()
    .trim()
    .min(1, 'El motivo del cambio es obligatorio')
    .max(
      ACCESS_CHANGE_REASON_MAX,
      `El motivo no puede pasar de ${ACCESS_CHANGE_REASON_MAX} caracteres`,
    ),
});

export type UpdateRoleAccessInput = z.infer<typeof updateRoleAccessSchema>;

/**
 * Registro de un cambio de acceso. Es inmutable: no se edita ni se borra.
 *
 * Guarda el antes y el después completos en lugar de la diferencia. Reconstruir
 * el estado a partir de diferencias exige que la cadena esté intacta desde el
 * origen, y una sola pérdida la vuelve inútil.
 */
export interface RoleAccessAuditEntry {
  id: string;
  roleId: string;
  roleName: string;

  /** Nulo si el usuario que hizo el cambio se eliminó después. */
  userId: string | null;
  userName: string | null;

  reason: string;

  previousModules: string[];
  newModules: string[];
  previousPermissions: string[];
  newPermissions: string[];

  /** Fecha y hora en ISO 8601. Ver la regla de DateTime en CODING_STANDARDS.md. */
  occurredAt: string;
}

/**
 * # Alcance (Scope) — declarado, no implementado
 *
 * Un Scope **no es un permiso**. Un permiso dice qué acciones puede ejecutar un
 * usuario; el Scope dice **sobre qué datos** puede ejecutarlas.
 *
 * Ejemplos previstos:
 *
 * | Scope      | Significado                                  |
 * | ---------- | -------------------------------------------- |
 * | `own`      | Solo los registros asignados al usuario      |
 * | `branch`   | Los de su sucursal                           |
 * | `zone`     | Los de sus zonas de trabajo                  |
 * | `project`  | Los del proyecto en el que participa          |
 * | `all`      | Todos                                        |
 *
 * Dos usuarios con `tickets.view` y Scope distinto tienen el mismo permiso y ven
 * conjuntos de datos diferentes. Por eso el Scope no puede modelarse como un
 * permiso más: filtra consultas, no habilita acciones.
 *
 * **Nada evalúa este tipo todavía.** Se declara para que el día que se implemente
 * el contrato no cambie: el servicio de autorización ya expone la forma
 * (`can`, `canAccess`) y el Scope entrará como un tercer método sin tocar a
 * quienes ya consultan los otros dos.
 */
export type AccessScope = 'own' | 'branch' | 'zone' | 'project' | 'all';

/**
 * # Ampliaciones previstas — declaradas, no implementadas
 *
 * Lo que este release deja preparado y deliberadamente sin construir:
 *
 * - **Roles múltiples por usuario.** Ya es posible en la base de datos
 *   (`user_roles` es una relación de muchos a muchos) y en el contrato
 *   (`AuthenticatedUser.roles` es una lista). Lo que falta es decidir cómo se
 *   combinan dos roles con accesos distintos; hoy se acumulan.
 * - **Restricciones por alcance.** Ver `AccessScope`.
 * - **Permisos temporales.** `role_permissions` tendría que llevar vigencia
 *   (`validFrom`, `validUntil`) y el cálculo del acceso efectivo descartar lo
 *   caducado. Ese cálculo ya está encapsulado en un solo sitio por rol.
 * - **Herencia de permisos.** Un rol podría declarar un rol padre del que hereda.
 *   El acceso efectivo se resolvería al calcularlo, no al guardarlo, para que
 *   cambiar el padre se refleje sin reescribir a los hijos.
 *
 * Ninguna exige romper compatibilidad: las cuatro se resuelven en el cálculo del
 * acceso efectivo, y ese cálculo no lo conoce nadie fuera del backend.
 */
export interface PlannedAccessFeatures {
  multipleRoles: false;
  scopes: false;
  temporaryPermissions: false;
  roleInheritance: false;
}
