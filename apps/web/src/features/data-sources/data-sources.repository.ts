import type {
  CreateDataSourceInput,
  DataSourceConnectionTest,
  DataSourceProviderDefinition,
  DataSourceSummary,
  TestDataSourceConnectionInput,
  UpdateDataSourceInput,
} from '@redsis/contracts';

/**
 * Contrato de acceso a las fuentes de datos.
 *
 * Nada de lo que devuelve contiene credenciales: la API responde con
 * `hasCredentials` y nunca con el valor. Es una garantía del backend, no una
 * cortesía de este contrato, pero conviene que se lea aquí también: quien
 * implemente otra pantalla no debe poder pensar que puede pedirlas.
 */
export interface DataSourceRepository {
  /** Qué proveedores existen, qué pide cada uno y cuáles están implementados. */
  listProviders(): Promise<DataSourceProviderDefinition[]>;

  list(): Promise<DataSourceSummary[]>;

  create(input: CreateDataSourceInput): Promise<DataSourceSummary>;

  /** Omitir las credenciales conserva las guardadas. */
  update(id: string, input: UpdateDataSourceInput): Promise<DataSourceSummary>;

  remove(id: string): Promise<void>;

  setDefault(id: string): Promise<DataSourceSummary>;

  /** Comprueba una configuración, guardada o todavía sin guardar. */
  testConnection(input: TestDataSourceConnectionInput): Promise<DataSourceConnectionTest>;
}
