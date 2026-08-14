import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { PERMISSIONS, type DataSourceSummary } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { EntityModal } from '@/shared/components/form/entity-modal';
import { DataTable, RowActions } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { Forbidden } from '@/shared/components/layout/forbidden';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import {
  dataSourceColumns,
  getDataSourceRowId,
} from '@/features/data-sources/columns/data-source.columns';
import { buildDataSourceActions } from '@/features/data-sources/data-source-actions';
import { DataSourceForm } from '@/features/data-sources/data-source-form';
import {
  useCreateDataSource,
  useDataSourceProviders,
  useDataSources,
  useRemoveDataSource,
  useSetDefaultDataSource,
  useUpdateDataSource,
} from '@/features/data-sources/use-data-sources';
import { authenticatedRoute } from './authenticated.route';

export const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/settings',
  component: SettingsPage,
});

/** Estado del modal: cerrado, creando, o editando una fuente concreta. */
type FormState =
  { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; source: DataSourceSummary };

/**
 * Pantalla de Configuración.
 *
 * Su primera responsabilidad son las **fuentes de datos**: de dónde salen los
 * tickets de cada proyecto. Vive en el módulo Configuración porque el catálogo ya
 * lo declaraba para los ajustes de la plataforma; darle un módulo propio habría
 * inflado el catálogo por una pantalla.
 *
 * La página orquesta y no contiene reglas: qué campos pide cada proveedor lo
 * declara el catálogo, qué es una configuración válida lo decide el backend, y qué
 * acciones existen lo declara la feature.
 */
function SettingsPage(): React.JSX.Element {
  const auth = useAuthorization();
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' });

  const providersQuery = useDataSourceProviders();
  const dataSourcesQuery = useDataSources();

  const createDataSource = useCreateDataSource();
  const updateDataSource = useUpdateDataSource(
    formState.mode === 'edit' ? formState.source.id : '',
  );
  const removeDataSource = useRemoveDataSource();
  const setDefaultDataSource = useSetDefaultDataSource();

  if (!auth.can(PERMISSIONS.DATA_SOURCES_VIEW)) {
    return <Forbidden detail="No tienes permiso para administrar las fuentes de datos." />;
  }

  const closeForm = (): void => {
    setFormState({ mode: 'closed' });
    createDataSource.reset();
    updateDataSource.reset();
  };

  const actions = buildDataSourceActions({
    can: auth.can,
    onEdit: (source) => setFormState({ mode: 'edit', source }),
    onSetDefault: (source) => setDefaultDataSource.mutate(source.id),
    onRemove: (source) => removeDataSource.mutate(source.id),
  });

  const sources = dataSourcesQuery.data ?? [];
  const actionError = removeDataSource.error ?? setDefaultDataSource.error;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fuentes de datos</h1>
          <p className="text-sm text-muted-foreground">
            De dónde salen los tickets de cada proyecto
          </p>
        </div>

        {auth.can(PERMISSIONS.DATA_SOURCES_CREATE) ? (
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva fuente
          </Button>
        ) : null}
      </header>

      {actionError ? <Alert variant="destructive">{actionError.message}</Alert> : null}

      {sources.length === 0 && !dataSourcesQuery.isPending ? (
        <Alert>
          Todavía no hay ninguna fuente configurada. Mientras no la haya, los tickets salen del
          origen que indique la configuración del servidor.
        </Alert>
      ) : null}

      <DataTable
        tableId={TABLE_IDS.DATA_SOURCES}
        columns={dataSourceColumns}
        data={sources}
        getRowId={getDataSourceRowId}
        loading={dataSourcesQuery.isPending}
        error={dataSourcesQuery.error}
        rowActions={(source) => <RowActions row={source} actions={actions} />}
        searchPlaceholder="Buscar por nombre o proveedor..."
        emptyMessage="No hay fuentes que coincidan con la búsqueda"
      />

      <EntityModal
        isOpen={formState.mode !== 'closed'}
        onClose={closeForm}
        isBlocked={createDataSource.isPending || updateDataSource.isPending}
        title={formState.mode === 'edit' ? 'Editar fuente de datos' : 'Nueva fuente de datos'}
        description={
          formState.mode === 'edit'
            ? 'Las credenciales guardadas se conservan si dejas su campo vacío.'
            : 'Elige el proveedor y configura cómo conectarse. Las credenciales se guardan cifradas.'
        }
      >
        <DataSourceForm
          providers={providersQuery.data ?? []}
          editing={formState.mode === 'edit' ? formState.source : null}
          isSubmitting={createDataSource.isPending || updateDataSource.isPending}
          error={createDataSource.error ?? updateDataSource.error}
          onCancel={closeForm}
          onSubmit={(input) => {
            if (formState.mode === 'edit') {
              updateDataSource.mutate(input, { onSuccess: closeForm });
              return;
            }

            createDataSource.mutate(input, { onSuccess: closeForm });
          }}
        />
      </EntityModal>
    </div>
  );
}
