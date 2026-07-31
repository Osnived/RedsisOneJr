import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDefinition } from '@/shared/types/table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';
import { AdvancedTable } from './advanced-table';
import { DataTable } from './data-table';

function renderGrouped(columns: ColumnDefinition<DemoRow>[] = DEMO_COLUMNS, rowCount = 6) {
  return render(
    <AdvancedTable<DemoRow>
      tableId="agrupada"
      columns={columns}
      data={buildDemoRows(rowCount)}
      getRowId={getDemoRowId}
      capabilities={{ grouping: true }}
    />,
  );
}

function selector(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Agrupar por' });
}

/** Filas del cuerpo, sin contar la cabecera. */
function bodyRows(): HTMLElement[] {
  const [, ...rows] = screen.getAllByRole('row');
  return rows;
}

describe('agrupaciones', () => {
  it('ofrece solo las columnas que el módulo declaró agrupables', () => {
    renderGrouped();

    // De las cuatro columnas de prueba, solo Activo es agrupable.
    expect(selector()).toHaveTextContent('Sin agrupar');
    expect(selector()).toHaveTextContent('Activo');
    expect(selector()).not.toHaveTextContent('Nombre');
    expect(selector()).not.toHaveTextContent('Monto');
  });

  it('no aparece si ninguna columna es agrupable', () => {
    const withoutGroupable = DEMO_COLUMNS.map((column) => ({ ...column, groupable: false }));

    renderGrouped(withoutGroupable);

    expect(screen.queryByRole('combobox', { name: 'Agrupar por' })).not.toBeInTheDocument();
  });

  it('no aparece si la capacidad está apagada', () => {
    render(
      <AdvancedTable<DemoRow>
        tableId="sin-agrupar"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(4)}
        getRowId={getDemoRowId}
      />,
    );

    expect(screen.queryByRole('combobox', { name: 'Agrupar por' })).not.toBeInTheDocument();
  });

  it('arranca sin agrupar', () => {
    renderGrouped();

    expect(selector()).toHaveValue('');
    expect(bodyRows()).toHaveLength(6);
  });

  it('crea una fila por grupo al agrupar', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');

    // Los datos de prueba alternan activo/inactivo: dos grupos de tres.
    expect(screen.getByRole('button', { name: /^Grupo Sí/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Grupo No/ })).toBeInTheDocument();
  });

  it('indica cuántos registros contiene cada grupo', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');

    expect(screen.getByRole('button', { name: 'Grupo Sí, 3 registros' })).toBeInTheDocument();
  });

  it('usa el singular con un solo registro', async () => {
    const user = userEvent.setup();
    renderGrouped(DEMO_COLUMNS, 1);

    await user.selectOptions(selector(), 'active');

    expect(screen.getByRole('button', { name: 'Grupo Sí, 1 registro' })).toBeInTheDocument();
  });

  it('muestra los grupos abiertos desde el principio', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');

    expect(screen.getByRole('button', { name: /^Grupo Sí/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Registro 001')).toBeInTheDocument();
  });

  it('pliega un grupo sin ocultar los demás', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');
    await user.click(screen.getByRole('button', { name: /^Grupo Sí/ }));

    expect(screen.getByRole('button', { name: /^Grupo Sí/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Registro 001')).not.toBeInTheDocument();
    // El grupo contrario sigue abierto.
    expect(screen.getByText('Registro 002')).toBeInTheDocument();
  });

  it('vuelve a desplegar un grupo plegado', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');
    await user.click(screen.getByRole('button', { name: /^Grupo Sí/ }));
    await user.click(screen.getByRole('button', { name: /^Grupo Sí/ }));

    expect(screen.getByText('Registro 001')).toBeInTheDocument();
  });

  it('deshace la agrupación', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');
    await user.selectOptions(selector(), '');

    expect(screen.queryByRole('button', { name: /registros/ })).not.toBeInTheDocument();
    expect(bodyRows()).toHaveLength(6);
  });

  it('usa la etiqueta declarada por la columna en lugar del código', async () => {
    const user = userEvent.setup();
    const withLabel: ColumnDefinition<DemoRow>[] = [
      DEMO_COLUMNS[0]!,
      {
        id: 'code',
        header: 'Código',
        accessor: (row) => (row.active ? 'en-ruta' : 'en-sitio'),
        groupable: true,
        groupLabel: (value) => (value === 'en-ruta' ? 'En ruta' : 'En sitio'),
      },
    ];

    renderGrouped(withLabel);
    await user.selectOptions(selector(), 'code');

    expect(screen.getByRole('button', { name: /^Grupo En ruta/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Grupo en-ruta/ })).not.toBeInTheDocument();
  });

  it('cuenta registros y grupos en lugar de filas', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');

    // Las cabeceras de grupo también son filas: decir "1–8 de 8" habiendo seis
    // registros sería falso.
    expect(screen.getByText('6 registros en 2 grupos')).toBeInTheDocument();
  });

  it('vuelve al rango de filas al deshacer la agrupación', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.selectOptions(selector(), 'active');
    await user.selectOptions(selector(), '');

    expect(screen.getByText('Mostrando 1–6 de 6')).toBeInTheDocument();
  });

  it('recuerda la agrupación al volver a la pantalla', async () => {
    const user = userEvent.setup();
    const { unmount } = renderGrouped();

    await user.selectOptions(selector(), 'active');
    unmount();

    renderGrouped();

    expect(selector()).toHaveValue('active');
  });
});

describe('el BaseTable no cambia', () => {
  it('no ofrece agrupar aunque una columna lo permita', () => {
    render(
      <DataTable<DemoRow>
        tableId="base"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(6)}
        getRowId={getDemoRowId}
      />,
    );

    expect(screen.queryByRole('combobox', { name: 'Agrupar por' })).not.toBeInTheDocument();
  });

  it('sigue dibujando una fila por registro', () => {
    render(
      <DataTable<DemoRow>
        tableId="base"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(6)}
        getRowId={getDemoRowId}
      />,
    );

    expect(bodyRows()).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /registros/ })).not.toBeInTheDocument();
  });
});
