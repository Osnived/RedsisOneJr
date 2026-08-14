import type { DataSourceProvider } from '@redsis/contracts';

/**
 * Tipos de dominio de las fuentes de datos.
 *
 * No son modelos de Prisma: es lo que impide que el dominio quede atado al ORM
 * (ver docs/ARCHITECTURE.md). El Provider traduce de un lado y el servicio del
 * otro.
 */

/**
 * Una fuente tal como la guarda el Repository.
 *
 * Las credenciales viajan **cifradas** incluso dentro del backend. Solo el
 * servicio, que tiene la clave, las descifra y únicamente en el momento de hablar
 * con el proveedor: así ningún componente puede filtrarlas por descuido en un log
 * o en una respuesta.
 */
export interface DataSourceRecord {
  id: string;
  name: string;
  description: string | null;
  provider: DataSourceProvider;
  settings: Record<string, string>;

  /** Sobre cifrado, o null si la fuente todavía no tiene credenciales. */
  encryptedCredentials: string | null;

  isActive: boolean;
  isDefault: boolean;
  lastCheckedAt: Date | null;
  lastCheckOk: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDataSourceData {
  name: string;
  description: string | null;
  provider: DataSourceProvider;
  settings: Record<string, string>;
  encryptedCredentials: string | null;
  isActive: boolean;
}

/**
 * Cambios sobre una fuente existente.
 *
 * Cada campo es opcional y **omitir no es lo mismo que vaciar**: omitir las
 * credenciales las conserva, que es lo que permite cambiar el nombre de una
 * fuente sin volver a escribir su token.
 *
 * `provider` no está: cambiarlo dejaría la configuración y las columnas apuntando
 * a un origen que no las entiende.
 */
export interface UpdateDataSourceData {
  name?: string;
  description?: string | null;
  settings?: Record<string, string>;
  encryptedCredentials?: string;
  isActive?: boolean;
}
