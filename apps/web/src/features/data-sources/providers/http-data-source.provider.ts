import type {
  CreateDataSourceInput,
  DataSourceConnectionTest,
  DataSourceProviderDefinition,
  DataSourceSummary,
  TestDataSourceConnectionInput,
  UpdateDataSourceInput,
} from '@redsis/contracts';
import { apiClient } from '@/shared/lib/api-client';
import type { DataSourceRepository } from '../data-sources.repository';

/**
 * Fuentes de datos a través de la API de la plataforma.
 *
 * Las credenciales viajan de ida y nunca de vuelta: se envían al crear o
 * actualizar y no aparecen en ninguna respuesta. Este archivo no las guarda, no
 * las cachea y no las vuelve a pedir.
 */
export const httpDataSourceProvider: DataSourceRepository = {
  listProviders: (): Promise<DataSourceProviderDefinition[]> =>
    apiClient.get<DataSourceProviderDefinition[]>('/data-sources/providers'),

  list: (): Promise<DataSourceSummary[]> => apiClient.get<DataSourceSummary[]>('/data-sources'),

  create: (input: CreateDataSourceInput): Promise<DataSourceSummary> =>
    apiClient.post<DataSourceSummary>('/data-sources', input),

  update: (id: string, input: UpdateDataSourceInput): Promise<DataSourceSummary> =>
    apiClient.patch<DataSourceSummary>(`/data-sources/${id}`, input),

  remove: (id: string): Promise<void> => apiClient.delete<void>(`/data-sources/${id}`),

  setDefault: (id: string): Promise<DataSourceSummary> =>
    apiClient.patch<DataSourceSummary>(`/data-sources/${id}/default`),

  testConnection: (input: TestDataSourceConnectionInput): Promise<DataSourceConnectionTest> =>
    apiClient.post<DataSourceConnectionTest>('/data-sources/test-connection', input),
};
