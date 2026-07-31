import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NO_ADVANCED_CAPABILITIES } from '@/shared/types/table';
import { AdvancedTable } from './advanced-table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';

type Props = Partial<React.ComponentProps<typeof AdvancedTable<DemoRow>>>;

function renderAdvanced(overrides: Props = {}) {
  return render(
    <AdvancedTable<DemoRow>
      tableId={overrides.tableId ?? 'avanzada'}
      columns={DEMO_COLUMNS}
      data={overrides.data ?? buildDemoRows(5)}
      getRowId={getDemoRowId}
      {...overrides}
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdvancedTable', () => {
  it('hereda todo el comportamiento del BaseTable', () => {
    renderAdvanced();

    // Búsqueda, columnas y paginación llegan por delegación, no por copia.
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Columnas/ })).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–5 de 5')).toBeInTheDocument();
    expect(screen.getByText('Registro 001')).toBeInTheDocument();
  });

  it('arranca sin ninguna capacidad avanzada activa', () => {
    expect(Object.values(NO_ADVANCED_CAPABILITIES).every((value) => value === false)).toBe(true);
  });

  it('no avisa cuando no se habilita ninguna capacidad', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderAdvanced();

    expect(warn).not.toHaveBeenCalled();
  });

  it('avisa si se habilita una capacidad todavía sin implementar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderAdvanced({ capabilities: { kanban: true } });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('kanban'));
  });

  it('enumera todas las capacidades pendientes en un solo aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderAdvanced({ capabilities: { timeline: true, exports: true } });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('timeline'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('exports'));
  });

  it('sigue mostrando los datos aunque se habilite algo pendiente', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderAdvanced({ capabilities: { kanban: true } });

    expect(screen.getByText('Registro 001')).toBeInTheDocument();
  });

  describe('ranuras preparadas para el futuro', () => {
    it('reserva un lugar para la barra de vistas', () => {
      renderAdvanced({ viewsBar: <div>barra de vistas</div> });

      expect(screen.getByText('barra de vistas')).toBeInTheDocument();
    });

    it('reserva un lugar para el panel lateral', () => {
      renderAdvanced({ sidePanel: <aside>panel de columnas</aside> });

      expect(screen.getByText('panel de columnas')).toBeInTheDocument();
    });

    it('no dibuja nada cuando las ranuras están vacías', () => {
      renderAdvanced();

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });

  describe('configuración de columnas', () => {
    /** Abre el panel y lo devuelve. */
    async function openPanel(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
      await user.click(screen.getByRole('button', { name: /^Columnas,/ }));

      return screen.getByRole('complementary', { name: 'Configuración de columnas' });
    }

    it('no avisa, porque la capacidad ya está implementada', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      renderAdvanced({ capabilities: { columnSettings: true } });

      expect(warn).not.toHaveBeenCalled();
    });

    it('sin la capacidad conserva el desplegable del BaseTable', async () => {
      const user = userEvent.setup();
      renderAdvanced();

      await user.click(screen.getByRole('button', { name: /^Columnas,/ }));

      expect(screen.getByRole('group', { name: 'Columnas visibles' })).toBeInTheDocument();
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('con la capacidad sustituye el desplegable por el panel lateral', async () => {
      const user = userEvent.setup();
      renderAdvanced({ capabilities: { columnSettings: true } });

      await openPanel(user);

      // Dos controles para lo mismo obligarían a averiguar en qué se diferencian.
      expect(screen.queryByRole('group', { name: 'Columnas visibles' })).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Columnas,/ })).toHaveLength(1);
    });

    it('arranca con el panel cerrado', () => {
      renderAdvanced({ capabilities: { columnSettings: true } });

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('oculta la columna de la tabla al desmarcarla en el panel', async () => {
      const user = userEvent.setup();
      renderAdvanced({ capabilities: { columnSettings: true } });

      expect(screen.getByRole('columnheader', { name: /Monto/ })).toBeInTheDocument();

      const panel = await openPanel(user);
      await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));

      expect(screen.queryByRole('columnheader', { name: /Monto/ })).not.toBeInTheDocument();
    });

    it('muestra en la tabla una columna oculta al marcarla', async () => {
      const user = userEvent.setup();
      renderAdvanced({ capabilities: { columnSettings: true } });

      const panel = await openPanel(user);
      await user.click(within(panel).getByRole('checkbox', { name: 'Notas' }));

      expect(screen.getByRole('columnheader', { name: /Notas/ })).toBeInTheDocument();
    });

    it('cierra el panel desde su propio botón', async () => {
      const user = userEvent.setup();
      renderAdvanced({ capabilities: { columnSettings: true } });

      const panel = await openPanel(user);
      await user.click(within(panel).getByRole('button', { name: 'Cerrar panel de columnas' }));

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('cierra el panel volviendo a pulsar el botón de la barra', async () => {
      const user = userEvent.setup();
      renderAdvanced({ capabilities: { columnSettings: true } });

      await openPanel(user);
      await user.click(screen.getByRole('button', { name: /^Columnas,/ }));

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('recuerda las columnas ocultas al volver a la pantalla', async () => {
      const user = userEvent.setup();
      const options = {
        tableId: 'avanzada-persistida',
        capabilities: { columnSettings: true },
      };

      const { unmount } = renderAdvanced(options);
      const panel = await openPanel(user);
      await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));
      unmount();

      renderAdvanced(options);

      expect(screen.queryByRole('columnheader', { name: /Monto/ })).not.toBeInTheDocument();
    });

    it('convive con la ranura de panel lateral del módulo', async () => {
      const user = userEvent.setup();
      renderAdvanced({
        capabilities: { columnSettings: true },
        sidePanel: <aside aria-label="Panel del módulo">contenido propio</aside>,
      });

      await openPanel(user);

      expect(screen.getByRole('complementary', { name: 'Panel del módulo' })).toBeInTheDocument();
      expect(
        screen.getByRole('complementary', { name: 'Configuración de columnas' }),
      ).toBeInTheDocument();
    });
  });

  it('acepta las mismas propiedades que el BaseTable', () => {
    renderAdvanced({
      loading: false,
      enableRowSelection: true,
      toolbar: <button type="button">Acción propia</button>,
    });

    expect(screen.getByRole('button', { name: 'Acción propia' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })).toHaveLength(5);
  });
});
