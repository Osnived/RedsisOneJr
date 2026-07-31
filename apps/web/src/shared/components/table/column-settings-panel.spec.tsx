import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDefinition } from '@/shared/types/table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';
import { ColumnSettingsPanel } from './column-settings-panel';
import { TableProvider } from './table-provider';

interface RenderOptions {
  onClose?: () => void;
  columns?: ColumnDefinition<DemoRow>[];
  tableId?: string;
}

function renderPanel({
  onClose = vi.fn(),
  columns = DEMO_COLUMNS,
  tableId = 'panel',
}: RenderOptions = {}) {
  render(
    <TableProvider<DemoRow>
      tableId={tableId}
      columns={columns}
      data={buildDemoRows(3)}
      getRowId={getDemoRowId}
    >
      <ColumnSettingsPanel onClose={onClose} />
    </TableProvider>,
  );

  return {
    onClose,
    panel: screen.getByRole('complementary', { name: 'Configuración de columnas' }),
  };
}

/** Nueve columnas ocultables: suficientes para que aparezca el buscador. */
const MANY_COLUMNS: ColumnDefinition<DemoRow>[] = Array.from({ length: 9 }, (_unused, index) => ({
  id: `campo-${index}`,
  header: `Campo ${index}`,
  accessor: (row: DemoRow) => row.name,
}));

describe('ColumnSettingsPanel', () => {
  it('lista solo las columnas que se pueden ocultar', () => {
    const { panel } = renderPanel();

    // Nombre está declarada como no ocultable: mostrarla deshabilitada solo
    // añadiría ruido, porque el usuario no puede actuar sobre ella.
    expect(within(panel).queryByRole('checkbox', { name: 'Nombre' })).not.toBeInTheDocument();
    expect(within(panel).getByRole('checkbox', { name: 'Monto' })).toBeInTheDocument();
    expect(within(panel).getByRole('checkbox', { name: 'Activo' })).toBeInTheDocument();
    expect(within(panel).getByRole('checkbox', { name: 'Notas' })).toBeInTheDocument();
  });

  it('marca las visibles y deja sin marcar las ocultas por defecto', () => {
    const { panel } = renderPanel();

    expect(within(panel).getByRole('checkbox', { name: 'Monto' })).toBeChecked();
    expect(within(panel).getByRole('checkbox', { name: 'Notas' })).not.toBeChecked();
  });

  it('informa cuántas columnas están visibles', () => {
    const { panel } = renderPanel();

    expect(within(panel).getByText('2 de 3 visibles')).toBeInTheDocument();
  });

  it('oculta una columna al desmarcarla', async () => {
    const user = userEvent.setup();
    const { panel } = renderPanel();

    await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));

    expect(within(panel).getByRole('checkbox', { name: 'Monto' })).not.toBeChecked();
    expect(within(panel).getByText('1 de 3 visibles')).toBeInTheDocument();
  });

  it('muestra una columna al marcarla', async () => {
    const user = userEvent.setup();
    const { panel } = renderPanel();

    await user.click(within(panel).getByRole('checkbox', { name: 'Notas' }));

    expect(within(panel).getByRole('checkbox', { name: 'Notas' })).toBeChecked();
    expect(within(panel).getByText('3 de 3 visibles')).toBeInTheDocument();
  });

  describe('restaurar configuración', () => {
    it('está deshabilitado mientras no haya nada que restaurar', () => {
      const { panel } = renderPanel();

      expect(within(panel).getByRole('button', { name: /Restaurar/ })).toBeDisabled();
    });

    it('se habilita en cuanto el usuario cambia algo', async () => {
      const user = userEvent.setup();
      const { panel } = renderPanel();

      await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));

      expect(within(panel).getByRole('button', { name: /Restaurar/ })).toBeEnabled();
    });

    it('devuelve las columnas a su estado inicial', async () => {
      const user = userEvent.setup();
      const { panel } = renderPanel();

      await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));
      await user.click(within(panel).getByRole('checkbox', { name: 'Notas' }));
      await user.click(within(panel).getByRole('button', { name: /Restaurar/ }));

      expect(within(panel).getByRole('checkbox', { name: 'Monto' })).toBeChecked();
      expect(within(panel).getByRole('checkbox', { name: 'Notas' })).not.toBeChecked();
      expect(within(panel).getByRole('button', { name: /Restaurar/ })).toBeDisabled();
    });

    it('borra también lo almacenado', async () => {
      const user = userEvent.setup();
      const { panel } = renderPanel({ tableId: 'restaurable' });

      await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));
      expect(localStorage.getItem('redsis.table.restaurable')).not.toBeNull();

      await user.click(within(panel).getByRole('button', { name: /Restaurar/ }));

      expect(localStorage.getItem('redsis.table.restaurable')).toBeNull();
    });
  });

  describe('cierre', () => {
    it('avisa al pulsar el botón de cerrar', async () => {
      const user = userEvent.setup();
      const { panel, onClose } = renderPanel();

      await user.click(within(panel).getByRole('button', { name: 'Cerrar panel de columnas' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('avisa al pulsar Escape', async () => {
      const user = userEvent.setup();
      const { panel, onClose } = renderPanel();

      within(panel).getByRole('checkbox', { name: 'Monto' }).focus();
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('búsqueda de columnas', () => {
    it('no ofrece buscador con pocas columnas', () => {
      const { panel } = renderPanel();

      expect(within(panel).queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('ofrece buscador cuando la lista es larga', () => {
      const { panel } = renderPanel({ columns: MANY_COLUMNS });

      expect(within(panel).getByRole('searchbox')).toBeInTheDocument();
    });

    it('deja solo las columnas que coinciden', async () => {
      const user = userEvent.setup();
      const { panel } = renderPanel({ columns: MANY_COLUMNS });

      await user.type(within(panel).getByRole('searchbox'), 'Campo 3');

      expect(within(panel).getByRole('checkbox', { name: 'Campo 3' })).toBeInTheDocument();
      expect(within(panel).queryByRole('checkbox', { name: 'Campo 4' })).not.toBeInTheDocument();
    });

    it('avisa cuando ninguna columna coincide', async () => {
      const user = userEvent.setup();
      const { panel } = renderPanel({ columns: MANY_COLUMNS });

      await user.type(within(panel).getByRole('searchbox'), 'inexistente');

      expect(within(panel).getByText('Ninguna columna coincide')).toBeInTheDocument();
    });
  });
});
