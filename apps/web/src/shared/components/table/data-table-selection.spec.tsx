import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROW_SELECTION_COLUMN_ID } from '@/shared/types/table';
import { DataTable } from './data-table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';

type Props = Partial<React.ComponentProps<typeof DataTable<DemoRow>>>;

function renderTable(overrides: Props = {}) {
  return render(
    <DataTable<DemoRow>
      tableId={overrides.tableId ?? 'seleccion'}
      columns={DEMO_COLUMNS}
      data={overrides.data ?? buildDemoRows(5)}
      getRowId={getDemoRowId}
      enableRowSelection
      {...overrides}
    />,
  );
}

function rowCheckboxes(): HTMLElement[] {
  return screen.getAllByRole('checkbox', { name: 'Seleccionar fila' });
}

describe('Selección de filas', () => {
  it('no añade casillas si la selección no está habilitada', () => {
    render(
      <DataTable<DemoRow>
        tableId="sin-seleccion"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(3)}
        getRowId={getDemoRowId}
      />,
    );

    expect(screen.queryByRole('checkbox', { name: 'Seleccionar fila' })).not.toBeInTheDocument();
  });

  it('añade una casilla por fila y una en la cabecera', () => {
    renderTable();

    expect(rowCheckboxes()).toHaveLength(5);
    expect(
      screen.getByRole('checkbox', { name: 'Seleccionar todas las filas de la página' }),
    ).toBeInTheDocument();
  });

  it('coloca la casilla en la primera columna', () => {
    renderTable();

    const headerRow = screen.getAllByRole('row')[0];
    const firstHeader = within(headerRow as HTMLElement).getAllByRole('columnheader')[0];

    expect(
      within(firstHeader as HTMLElement).getByRole('checkbox', {
        name: 'Seleccionar todas las filas de la página',
      }),
    ).toBeInTheDocument();
  });

  it('no muestra la barra de selección cuando no hay nada marcado', () => {
    renderTable();

    expect(screen.queryByText(/fila seleccionada|filas seleccionadas/)).not.toBeInTheDocument();
  });

  it('informa una fila seleccionada en singular', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(rowCheckboxes()[0] as HTMLElement);

    expect(screen.getByText('1 fila seleccionada')).toBeInTheDocument();
  });

  it('informa varias filas en plural', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(rowCheckboxes()[0] as HTMLElement);
    await user.click(rowCheckboxes()[1] as HTMLElement);

    expect(screen.getByText('2 filas seleccionadas')).toBeInTheDocument();
  });

  it('entrega al módulo las filas seleccionadas, no sus identificadores', async () => {
    const onRowSelectionChange = vi.fn();
    const user = userEvent.setup();
    renderTable({ onRowSelectionChange });

    await user.click(rowCheckboxes()[0] as HTMLElement);

    expect(onRowSelectionChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'row-1', name: 'Registro 001' }),
    ]);
  });

  it('permite deseleccionar una fila', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(rowCheckboxes()[0] as HTMLElement);
    await user.click(rowCheckboxes()[0] as HTMLElement);

    expect(screen.queryByText('1 fila seleccionada')).not.toBeInTheDocument();
  });

  it('selecciona todas las filas de la página desde la cabecera', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(
      screen.getByRole('checkbox', { name: 'Seleccionar todas las filas de la página' }),
    );

    expect(screen.getByText('5 filas seleccionadas')).toBeInTheDocument();
  });

  it('marca la cabecera como estado intermedio con selección parcial', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(rowCheckboxes()[0] as HTMLElement);

    const headerCheckbox = screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Seleccionar todas las filas de la página',
    });
    expect(headerCheckbox.indeterminate).toBe(true);
    expect(headerCheckbox.checked).toBe(false);
  });

  it('limpia la selección completa', async () => {
    const onRowSelectionChange = vi.fn();
    const user = userEvent.setup();
    renderTable({ onRowSelectionChange });

    await user.click(
      screen.getByRole('checkbox', { name: 'Seleccionar todas las filas de la página' }),
    );
    await user.click(screen.getByRole('button', { name: /Limpiar selección/ }));

    expect(screen.queryByText(/filas seleccionadas/)).not.toBeInTheDocument();
    expect(onRowSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('conserva la selección al cambiar de página', async () => {
    const user = userEvent.setup();
    renderTable({ tableId: 'seleccion-paginas', data: buildDemoRows(60) });

    await user.click(rowCheckboxes()[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    // La fila marcada ya no se ve, pero sigue contando.
    expect(screen.getByText('1 fila seleccionada')).toBeInTheDocument();
  });

  it('no permite ordenar ni ocultar la columna de selección', async () => {
    const user = userEvent.setup();
    renderTable({ tableId: 'seleccion-columna-fija' });

    await user.click(screen.getByRole('button', { name: /Columnas/ }));

    const listed = screen
      .getAllByRole('checkbox')
      .map((input) => input.getAttribute('name'))
      .filter((name): name is string => name !== null);

    expect(listed).not.toContain(ROW_SELECTION_COLUMN_ID);
  });

  it('la selección no se persiste entre montajes', async () => {
    const user = userEvent.setup();
    const first = renderTable({ tableId: 'seleccion-no-persiste' });

    await user.click(rowCheckboxes()[0] as HTMLElement);
    expect(screen.getByText('1 fila seleccionada')).toBeInTheDocument();
    first.unmount();

    renderTable({ tableId: 'seleccion-no-persiste' });

    expect(screen.queryByText('1 fila seleccionada')).not.toBeInTheDocument();
  });
});
