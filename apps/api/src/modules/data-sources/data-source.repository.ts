import type {
  CreateDataSourceData,
  DataSourceRecord,
  UpdateDataSourceData,
} from './data-source.types';

/**
 * Contrato de acceso a las fuentes de datos.
 *
 * Es el patrón habitual de la plataforma: clase abstracta como contrato y como
 * token de inyección, con el origen resuelto en el módulo. Aquí sí es una sola
 * línea, porque las fuentes viven siempre en la PostgreSQL de la plataforma: son
 * su configuración, no datos operacionales.
 */
export abstract class DataSourceRepository {
  abstract list(): Promise<DataSourceRecord[]>;

  abstract findById(id: string): Promise<DataSourceRecord | null>;

  abstract findByName(name: string): Promise<DataSourceRecord | null>;

  /** La fuente que atiende cuando no se pide un proyecto concreto. */
  abstract findDefault(): Promise<DataSourceRecord | null>;

  abstract create(data: CreateDataSourceData): Promise<DataSourceRecord>;

  abstract update(id: string, data: UpdateDataSourceData): Promise<DataSourceRecord>;

  abstract remove(id: string): Promise<void>;

  /**
   * Marca una fuente como la de por defecto y retira la marca de las demás.
   *
   * Es una sola operación y en transacción: dos fuentes marcadas a la vez, o
   * ninguna, dejarían la pantalla de Tickets sin saber a cuál preguntar.
   */
  abstract setDefault(id: string): Promise<DataSourceRecord>;

  /** Guarda el resultado de la última comprobación de conexión. */
  abstract recordCheck(id: string, ok: boolean, checkedAt: Date): Promise<void>;
}
