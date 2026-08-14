import { useState } from 'react';
import {
  DATA_SOURCE_FIELD_KINDS,
  type CreateDataSourceInput,
  type DataSourceProvider,
  type DataSourceProviderDefinition,
  type DataSourceSummary,
} from '@redsis/contracts';
import { EntityForm } from '@/shared/components/form/entity-form';
import { FormField, fieldAccessibilityProps } from '@/shared/components/form/form-field';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useTestDataSourceConnection } from './use-data-sources';

interface DataSourceFormProps {
  providers: DataSourceProviderDefinition[];
  /** La fuente a editar, o null para dar de alta una nueva. */
  editing: DataSourceSummary | null;
  onSubmit: (input: CreateDataSourceInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: Error | null;
}

/**
 * Formulario de una fuente de datos.
 *
 * **Dibuja los campos que declara el proveedor elegido**, sin saber cuáles son:
 * los pide al catálogo y los pinta. Es lo que evita la lógica dispersa que prohíbe
 * el §9 del MVP —no hay ningún `if (provider === 'redsis-one')` en esta pantalla—
 * y lo que hace que añadir un proveedor no obligue a tocar React.
 *
 * Los campos marcados como secretos se pintan como contraseña y **no se rellenan
 * al editar**: la API nunca los devuelve. Dejarlos vacíos conserva los guardados.
 *
 * La validación de qué campos son obligatorios la aplica el backend, que es quien
 * conoce el catálogo de verdad, y devuelve un mensaje legible ("Falta configurar:
 * Tablero"). Repetirla aquí crearía dos versiones de la misma regla.
 */
export function DataSourceForm({
  providers,
  editing,
  onSubmit,
  onCancel,
  isSubmitting,
  error = null,
}: DataSourceFormProps): React.JSX.Element {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [provider, setProvider] = useState<DataSourceProvider>(
    editing?.provider ?? providers[0]?.key ?? 'mock',
  );
  const [settings, setSettings] = useState<Record<string, string>>(editing?.settings ?? {});
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const testConnection = useTestDataSourceConnection();
  const definition = providers.find((candidate) => candidate.key === provider);

  function buildInput(): CreateDataSourceInput {
    return {
      name: name.trim(),
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
      provider,
      settings,
      credentials,
      isActive: editing?.isActive ?? true,
    };
  }

  return (
    <EntityForm
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(buildInput());
      }}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      error={error}
      submitLabel={editing === null ? 'Crear fuente' : 'Guardar cambios'}
    >
      <FormField name="data-source-name" label="Nombre" required>
        <Input
          {...fieldAccessibilityProps({ name: 'data-source-name' })}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tickets Retail"
        />
      </FormField>

      <FormField name="data-source-description" label="Descripción">
        <Input
          {...fieldAccessibilityProps({ name: 'data-source-description' })}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      <FormField
        name="data-source-provider"
        label="Proveedor"
        required
        {...(editing === null
          ? {}
          : { hint: 'El proveedor no se puede cambiar: se crea otra fuente y se retira esta.' })}
      >
        <select
          {...fieldAccessibilityProps({ name: 'data-source-provider' })}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={provider}
          disabled={editing !== null}
          onChange={(event) => {
            setProvider(event.target.value as DataSourceProvider);
            // Los parámetros de un proveedor no significan nada en otro.
            setSettings({});
            setCredentials({});
          }}
        >
          {providers.map((candidate) => (
            <option key={candidate.key} value={candidate.key}>
              {candidate.label}
              {candidate.isImplemented ? '' : ' (sin implementar)'}
            </option>
          ))}
        </select>
      </FormField>

      {definition?.isImplemented === false ? (
        <Alert>
          {definition.label} está declarado y todavía no se puede usar como origen. Se puede
          configurar desde ya; podrá activarse cuando exista su proveedor.
        </Alert>
      ) : null}

      {definition?.fields.map((field) => {
        const isSecret = field.kind === DATA_SOURCE_FIELD_KINDS.SECRET;
        const inputName = `data-source-${field.key}`;
        const storedSecret = isSecret && editing?.hasCredentials === true;

        return (
          <FormField
            key={field.key}
            name={inputName}
            label={field.label}
            required={field.isRequired}
            {...(storedSecret
              ? { hint: 'Ya hay un valor guardado. Déjalo vacío para conservarlo.' }
              : field.help !== null
                ? { hint: field.help }
                : {})}
          >
            <Input
              {...fieldAccessibilityProps({ name: inputName })}
              type={isSecret ? 'password' : 'text'}
              autoComplete={isSecret ? 'new-password' : 'off'}
              value={isSecret ? (credentials[field.key] ?? '') : (settings[field.key] ?? '')}
              placeholder={field.placeholder ?? ''}
              onChange={(event) => {
                const { value } = event.target;
                const update = isSecret ? setCredentials : setSettings;

                update((current) => ({ ...current, [field.key]: value }));
              }}
            />
          </FormField>
        );
      })}

      <div className="flex flex-col gap-2">
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={testConnection.isPending}
            onClick={() => {
              const input = buildInput();

              testConnection.mutate({
                provider: input.provider,
                settings: input.settings,
                credentials: input.credentials,
                ...(editing === null ? {} : { dataSourceId: editing.id }),
              });
            }}
          >
            {testConnection.isPending ? 'Probando...' : 'Probar conexión'}
          </Button>
        </div>

        {testConnection.data ? (
          <Alert variant={testConnection.data.ok ? 'default' : 'destructive'}>
            {testConnection.data.message}
          </Alert>
        ) : null}
      </div>
    </EntityForm>
  );
}
