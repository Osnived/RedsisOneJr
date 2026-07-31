/** Forma en la que se representa un módulo. */
export type ViewMode = 'table' | 'cards';

/**
 * Todas las formas de representar un módulo, incluidas las que aún no existen.
 *
 * Se declaran desde ahora para que añadir una no cambie ningún contrato: un
 * módulo registra la vista y aparece. Todas consumen el mismo Repository, el
 * mismo Provider y la misma consulta de React Query; lo único que cambia es cómo
 * se dibuja la información.
 *
 * `ViewMode` es el subconjunto que `resolveViewMode` sabe elegir hoy.
 */
export type ViewKind = ViewMode | 'kanban' | 'calendar' | 'timeline' | 'map';

/** Vistas ya implementadas. Las demás están declaradas y pendientes. */
export const IMPLEMENTED_VIEW_KINDS: readonly ViewKind[] = ['table', 'cards'];

/**
 * Por qué se eligió esa forma.
 *
 * Se expone junto al modo para que la interfaz pueda explicarlo y para que un
 * fallo sea diagnosticable: sin el motivo, "veo tarjetas y no sé por qué" no
 * tiene respuesta.
 */
export type ViewModeReason = 'preferencia' | 'movil-sin-administracion' | 'predeterminado';

export interface ViewModeDecision {
  mode: ViewMode;
  reason: ViewModeReason;
}

export interface ViewModeInput {
  /**
   * Si el usuario administra la plataforma.
   *
   * Se recibe ya resuelto —y no los roles— porque la decisión no puede depender
   * del nombre de un rol: renombrarlo cambiaría lo que se ve. Quien llama lo
   * calcula con el servicio de autorización.
   */
  administersPlatform: boolean;

  isMobile: boolean;

  /**
   * Elección explícita del usuario, cuando exista dónde guardarla.
   *
   * Se contempla desde ahora porque una decisión automática que no se pueda
   * desobedecer acaba siendo un problema, y añadirla después habría cambiado la
   * firma de todo lo que ya dependiera de ella.
   */
  preference?: ViewMode | null;
}

/**
 * Decide cómo se representa un módulo.
 *
 * Es una función pura y no un hook para que la regla se pueda leer y probar de
 * un vistazo, sin montar componentes ni simular una pantalla.
 *
 * La regla: **quien administra la plataforma trabaja en escritorio; quien no, en
 * una pantalla pequeña ve tarjetas.** Una tabla en un móvil obliga a desplazarse
 * en horizontal para leer una sola fila, y quien está en campo necesita leer un
 * servicio de arriba abajo.
 *
 * No se mira el nombre del rol. Se mira lo que el usuario puede hacer, que es lo
 * que de verdad describe su trabajo: quien entra a Usuarios o a Seguridad
 * administra, y renombrar su rol no cambia eso.
 *
 * El orden importa: la preferencia del usuario gana siempre. Si alguien pidió ver
 * una tabla, dársela es más importante que cualquier heurística.
 */
export function resolveViewMode({
  administersPlatform,
  isMobile,
  preference = null,
}: ViewModeInput): ViewModeDecision {
  if (preference) {
    return { mode: preference, reason: 'preferencia' };
  }

  if (isMobile && !administersPlatform) {
    return { mode: 'cards', reason: 'movil-sin-administracion' };
  }

  return { mode: 'table', reason: 'predeterminado' };
}
