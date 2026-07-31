import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';
import { AdvancedTable } from './advanced-table';

function renderFiltered(tableId = 'filtrada', rowCount = 6) {
  return render(
    <AdvancedTable<DemoRow>
      tableId={tableId}
      columns={DEMO_COLUMNS}
      data={buildDemoRows(rowCount)}
      getRowId={getDemoRowId}
      capabilities={{ filters: true }}
    />,
  );
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: /^Filtros,/ });
}

function builder(): HTMLElement {
  return screen.getByRole('region', { name: 'Filtros avanzados' });
}

async function renderWithOneCondition(
  user: ReturnType<typeof userEvent.setup>,
  tableId = 'filtrada',
) {
  const rendered = renderFiltered(tableId);

  await user.click(trigger());
  await user.click(within(builder()).getByRole('button', { name: /Añadir condición/ }));

  return rendered;
}

/** Filas del cuerpo, sin contar la cabecera. */
function bodyRows(): HTMLElement[] {
  const [, ...rows] = screen.getAllByRole('row');
  return rows;
}

describe('FilterBuilder', () => {
  it('no aparece si la capacidad está apagada', () => {
    render(
      <AdvancedTable<DemoRow>
        tableId="sin-filtros"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(4)}
        getRowId={getDemoRowId}
      />,
    );

    expect(screen.queryByRole('button', { name: /^Filtros,/ })).not.toBeInTheDocument();
  });

  it('arranca cerrado y sin condiciones aplicadas', () => {
    renderFiltered();

    expect(trigger()).toHaveAccessibleName('Filtros, ninguno aplicado');
    expect(screen.queryByRole('region', { name: 'Filtros avanzados' })).not.toBeInTheDocument();
  });

  it('se abre desde la barra superior', async () => {
    const user = userEvent.setup();
    renderFiltered();

    await user.click(trigger());

    expect(builder()).toBeInTheDocument();
    expect(within(builder()).getByText(/Sin condiciones/)).toBeInTheDocument();
  });

  it('se cierra desde su botón', async () => {
    const user = userEvent.setup();
    renderFiltered();

    await user.click(trigger());
    await user.click(within(builder()).getByRole('button', { name: 'Cerrar filtros' }));

    expect(screen.queryByRole('region', { name: 'Filtros avanzados' })).not.toBeInTheDocument();
  });

  it('ofrece los siete operadores', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    const operator = within(builder()).getByRole('combobox', {
      name: 'Operador de la condición 1',
    });

    expect(within(operator).getAllByRole('option')).toHaveLength(7);
    for (const label of [
      'es',
      'no es',
      'contiene',
      'empieza por',
      'termina por',
      'vacío',
      'no vacío',
    ]) {
      expect(within(operator).getByRole('option', { name: label })).toBeInTheDocument();
    }
  });

  it('no ofrece las columnas del framework como criterio', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    const column = within(builder()).getByRole('combobox', { name: 'Columna de la condición 1' });

    // Solo las cuatro columnas de negocio: ni selección ni acciones.
    expect(within(column).getAllByRole('option')).toHaveLength(4);
  });

  it('filtra la tabla al completar una condición', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Columna de la condición 1' }),
      'name',
    );
    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
      'Registro 003',
    );

    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText('Registro 003')).toBeInTheDocument();
  });

  it('no vacía la tabla mientras la condición está a medias', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    // Recién añadida, la condición tiene operador "contiene" y valor vacío.
    expect(bodyRows()).toHaveLength(6);
    expect(trigger()).toHaveAccessibleName('Filtros, ninguno aplicado');
  });

  it('cuenta las condiciones que de verdad se aplican', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
      'Registro',
    );

    expect(trigger()).toHaveAccessibleName('Filtros, 1 aplicados');
  });

  it('oculta el valor con un operador que no lo necesita', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Operador de la condición 1' }),
      'vacio',
    );

    expect(
      within(builder()).queryByRole('combobox', { name: 'Valor de la condición 1' }),
    ).not.toBeInTheDocument();
  });

  it('descarta el valor escrito al pasar a un operador sin valor', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
      'algo',
    );
    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Operador de la condición 1' }),
      'noVacio',
    );
    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Operador de la condición 1' }),
      'contiene',
    );

    // Conservarlo dejaría un texto invisible que reaparece sin explicación.
    expect(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
    ).toHaveValue('');
  });

  it('combina dos condiciones con Y', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Columna de la condición 1' }),
      'name',
    );
    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
      'Registro',
    );

    await user.click(within(builder()).getByRole('button', { name: /Añadir condición/ }));
    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Columna de la condición 2' }),
      'active',
    );
    await user.selectOptions(
      within(builder()).getByRole('combobox', { name: 'Operador de la condición 2' }),
      'es',
    );
    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 2' }),
      'sí',
    );

    // De seis registros, los tres activos.
    expect(bodyRows()).toHaveLength(3);
    expect(trigger()).toHaveAccessibleName('Filtros, 2 aplicados');
  });

  it('quita una condición', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
      'Registro 003',
    );
    await user.click(within(builder()).getByRole('button', { name: 'Quitar la condición 1' }));

    expect(bodyRows()).toHaveLength(6);
    expect(within(builder()).getByText(/Sin condiciones/)).toBeInTheDocument();
  });

  it('quita todas las condiciones de una vez', async () => {
    const user = userEvent.setup();
    await renderWithOneCondition(user);

    await user.click(within(builder()).getByRole('button', { name: /Añadir condición/ }));
    await user.click(within(builder()).getByRole('button', { name: 'Quitar todas' }));

    expect(within(builder()).getByText(/Sin condiciones/)).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(6);
  });

  it('recuerda las condiciones al volver a la pantalla', async () => {
    const user = userEvent.setup();
    const { unmount } = await renderWithOneCondition(user, 'filtrada-persistida');

    await user.type(
      within(builder()).getByRole('combobox', { name: 'Valor de la condición 1' }),
      'Registro 003',
    );
    unmount();

    renderFiltered('filtrada-persistida');

    expect(bodyRows()).toHaveLength(1);
    expect(trigger()).toHaveAccessibleName('Filtros, 1 aplicados');
  });
});
