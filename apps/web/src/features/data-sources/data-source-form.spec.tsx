import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DATA_SOURCE_PROVIDERS,
  DATA_SOURCE_PROVIDER_DEFINITIONS,
  type DataSourceSummary,
} from '@redsis/contracts';
import { DataSourceForm } from './data-source-form';

/**
 * El formulario dibuja los campos que declara el proveedor elegido.
 *
 * Lo que se comprueba es justo eso: que la pantalla no sepa qué es RedsisOne y aun
 * así pida lo que RedsisOne necesita. Si esto se rompiera, la única salida sería un
 * condicional por proveedor en React, que es lo que el MVP prohíbe.
 */

const PROVIDERS = [...DATA_SOURCE_PROVIDER_DEFINITIONS];

function existingSource(overrides: Partial<DataSourceSummary> = {}): DataSourceSummary {
  return {
    id: 'fuente-1',
    name: 'Tickets Retail',
    description: null,
    provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
    settings: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
    hasCredentials: true,
    isActive: true,
    isDefault: false,
    lastCheckedAt: null,
    lastCheckOk: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

function renderForm(editing: DataSourceSummary | null = null) {
  const onSubmit = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <DataSourceForm
        providers={PROVIDERS}
        editing={editing}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />
    </QueryClientProvider>,
  );

  return { onSubmit };
}

describe('campos según el proveedor', () => {
  it('el origen simulado no pide configuración', () => {
    renderForm();

    expect(screen.queryByLabelText('Token de acceso')).not.toBeInTheDocument();
  });

  it('al elegir RedsisOne aparecen sus parámetros', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.REDSIS_ONE);

    expect(screen.getByLabelText(/URL del servicio/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Token de acceso/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tablero/)).toBeInTheDocument();
  });

  it('cambiar de proveedor descarta lo configurado del anterior', async () => {
    // Los parámetros de un proveedor no significan nada en otro.
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.REDSIS_ONE);
    await user.type(screen.getByLabelText(/Tablero/), 'BRD-XXXX');
    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.BASEROW);
    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.REDSIS_ONE);

    expect(screen.getByLabelText(/Tablero/)).toHaveValue('');
  });

  it('avisa de que un proveedor declarado todavía no se puede usar', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.SERVICENOW);

    expect(screen.getByText(/todavía no se puede usar como origen/)).toBeInTheDocument();
  });
});

describe('secretos', () => {
  it('un campo secreto se escribe como contraseña', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.REDSIS_ONE);

    expect(screen.getByLabelText(/Token de acceso/)).toHaveAttribute('type', 'password');
  });

  it('al editar no se rellena: la API no lo devuelve', () => {
    renderForm(existingSource());

    expect(screen.getByLabelText(/Token de acceso/)).toHaveValue('');
    expect(screen.getByText(/Déjalo vacío para conservarlo/)).toBeInTheDocument();
  });

  it('los parámetros no sensibles sí se rellenan al editar', () => {
    renderForm(existingSource());

    expect(screen.getByLabelText(/Tablero/)).toHaveValue('BRD-GVF3CC');
  });
});

describe('edición', () => {
  it('el proveedor de una fuente creada no se puede cambiar', () => {
    // Dejaría la configuración y las columnas apuntando a un origen que no las
    // entiende.
    renderForm(existingSource());

    expect(screen.getByLabelText(/Proveedor/)).toBeDisabled();
  });

  it('entrega lo escrito separando los secretos del resto', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/Nombre/), 'Tickets Norte');
    await user.selectOptions(screen.getByLabelText(/Proveedor/), DATA_SOURCE_PROVIDERS.REDSIS_ONE);
    await user.type(screen.getByLabelText(/Tablero/), 'BRD-GVF3CC');
    await user.type(screen.getByLabelText(/Token de acceso/), 'rsk_ejemplo');
    await user.click(screen.getByRole('button', { name: 'Crear fuente' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const input = onSubmit.mock.calls[0]?.[0] as {
      settings: Record<string, string>;
      credentials: Record<string, string>;
    };

    // El secreto va donde se cifra; el resto, donde no.
    expect(input.credentials).toEqual({ apiToken: 'rsk_ejemplo' });
    expect(input.settings).toEqual({ boardId: 'BRD-GVF3CC' });
  });
});
