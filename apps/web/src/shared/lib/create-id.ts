/**
 * Identificador único para algo que solo existe en el cliente.
 *
 * Lo usan las vistas guardadas y las condiciones de filtro: son objetos que el
 * usuario crea en su navegador y que necesitan una clave estable para poder
 * editarse y borrarse.
 *
 * `crypto.randomUUID` no existe en contextos no seguros, y perder la capacidad
 * de guardar una vista por servir la aplicación en HTTP sería desproporcionado.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
