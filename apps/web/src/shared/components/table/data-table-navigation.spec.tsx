import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import { RowActions } from './row-actions';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';

type Props = Partial<React.ComponentProps<typeof DataTable<DemoRow>>>;

function renderTable(overrides: Props = {}) {
  const onSelect = vi.fn();

  render(
    <DataTable<DemoRow>
      tableId={overrides.tableId ?? 'navegacion'}
      columns={DEMO_COLUMNS}
      data={overrides.data ?? buildDemoRows(3)}
      getRowId={getDemoRowId}
      rowNavigation={{ onSelect, label: (row) => `Abrir ${row.name}` }}
      {...overrides}
    />,
  );

  return { onSelect };
}

function firstRow(): HTMLElement {
  return screen.getByRole('row', { name: 'Abrir Registro 001' });
}

describe('Navegación desde la fila', () => {
  it('entrega la fila pulsada', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTable();

    await user.click(firstRow());

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'row-1' }));
  });

  it('nombra cada fila por su destino, no por su contenido', () => {
    renderTable();

    // Sin nombre propio, un lector de pantalla anuncia las celdas y no dice a
    // dónde lleva pulsar la fila.
    expect(screen.getByRole('row', { name: 'Abrir Registro 002' })).toBeInTheDocument();
  });

  it('se puede abrir con el teclado', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTable();

    firstRow().focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'row-1' }));
  });

  it('también con la barra espaciadora', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTable();

    firstRow().focus();
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('ignora las demás teclas', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTable();

    firstRow().focus();
    await user.keyboard('{Escape}');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('no navega al marcar la casilla de la fila', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTable({ enableRowSelection: true });

    await user.click(within(firstRow()).getByRole('checkbox', { name: 'Seleccionar fila' }));

    // Marcar y abrir son intenciones distintas: seleccionar para actuar en lote
    // no debe sacar al usuario de la tabla.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('no navega al usar el menú de acciones de la fila', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTable({
      rowActions: (row) => (
        <RowActions
          row={row}
          actions={[{ id: 'editar', label: 'Editar', onSelect: vi.fn() }]}
          label={`Acciones de ${row.name}`}
        />
      ),
    });

    await user.click(within(firstRow()).getByRole('button', { name: 'Acciones de Registro 001' }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('una tabla sin navegación no hace nada al pulsar una fila', async () => {
    const user = userEvent.setup();

    render(
      <DataTable<DemoRow>
        tableId="sin-navegacion"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(3)}
        getRowId={getDemoRowId}
      />,
    );

    const [, row] = screen.getAllByRole('row');

    // Ni foco ni nombre propio: la fila vuelve a ser solo una fila.
    expect(row).not.toHaveAttribute('tabindex');
    await user.click(row as HTMLElement);
  });
});
