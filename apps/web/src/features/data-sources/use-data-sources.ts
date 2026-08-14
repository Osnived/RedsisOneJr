import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  CreateDataSourceInput,
  DataSourceConnectionTest,
  DataSourceProviderDefinition,
  DataSourceSummary,
  TestDataSourceConnectionInput,
  UpdateDataSourceInput,
} from '@redsis/contracts';
import { httpDataSourceProvider } from './providers/http-data-source.provider';

/**
 * Consultas y acciones sobre las fuentes de datos.
 *
 * El origen se elige en un solo sitio, igual que en Tickets: aquí siempre es la
 * API, porque las fuentes son configuración de la plataforma y viven en su
 * PostgreSQL.
 */
const repository = httpDataSourceProvider;

export const dataSourcesQueryKeys = {
  all: ['data-sources'] as const,
  list: () => ['data-sources', 'list'] as const,
  providers: () => ['data-sources', 'providers'] as const,
};

/**
 * Catálogo de proveedores.
 *
 * Es lo que permite que el formulario dibuje los campos que pide cada proveedor
 * sin conocer ninguno: la pantalla pregunta qué hace falta y lo pinta. Sin esto
 * habría un condicional por proveedor en React, que es lo que prohíbe el MVP.
 *
 * Cambia solo al desplegar, así que no se vuelve a pedir mientras dure la sesión.
 */
export function useDataSourceProviders(): UseQueryResult<DataSourceProviderDefinition[], Error> {
  return useQuery({
    queryKey: dataSourcesQueryKeys.providers(),
    queryFn: () => repository.listProviders(),
    staleTime: Infinity,
  });
}

export function useDataSources(): UseQueryResult<DataSourceSummary[], Error> {
  return useQuery({
    queryKey: dataSourcesQueryKeys.list(),
    queryFn: () => repository.list(),
  });
}

export function useCreateDataSource(): UseMutationResult<
  DataSourceSummary,
  Error,
  CreateDataSourceInput
> {
  return useDataSourceMutation((input: CreateDataSourceInput) => repository.create(input));
}

export function useUpdateDataSource(
  id: string,
): UseMutationResult<DataSourceSummary, Error, UpdateDataSourceInput> {
  return useDataSourceMutation((input: UpdateDataSourceInput) => repository.update(id, input));
}

export function useRemoveDataSource(): UseMutationResult<void, Error, string> {
  return useDataSourceMutation((id: string) => repository.remove(id));
}

export function useSetDefaultDataSource(): UseMutationResult<DataSourceSummary, Error, string> {
  return useDataSourceMutation((id: string) => repository.setDefault(id));
}

/**
 * Prueba de conexión.
 *
 * Es una mutación y no una consulta porque no se cachea: probar dos veces la misma
 * configuración tiene que preguntar dos veces, que es justo lo que se espera de un
 * botón llamado "Probar conexión".
 */
export function useTestDataSourceConnection(): UseMutationResult<
  DataSourceConnectionTest,
  Error,
  TestDataSourceConnectionInput
> {
  return useMutation({
    mutationFn: (input: TestDataSourceConnectionInput) => repository.testConnection(input),
  });
}

/** Toda acción invalida el listado: cambiar una fuente puede cambiar cuál es la de por defecto. */
function useDataSourceMutation<TInput, TResult>(
  run: (input: TInput) => Promise<TResult>,
): UseMutationResult<TResult, Error, TInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dataSourcesQueryKeys.all });
    },
  });
}
