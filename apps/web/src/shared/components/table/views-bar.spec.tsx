import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';
import { AdvancedTable } from './advanced-table';

/**
 * Las vistas se prueban sobre la tabla avanzada completa y no sobre la barra
 * aislada: lo que hay que comprobar es que una vista devuelve la tabla al
 * estado que guardó, y eso solo se ve con la tabla delante.
 */
function renderWithViews(tableId = 'vistas') {
  return render(
    <AdvancedTable<DemoRow>
      tableId={tableId}
      columns={DEMO_COLUMNS}
      data={buildDemoRows(60)}
      getRowId={getDemoRowId}
      capabilities={{ views: true, columnSettings: true }}
    />,
  );
}

function viewsBar(): HTMLElement {
  return screen.getByRole('toolbar', { name: 'Vistas guardadas' });
}

async function saveViewNamed(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(within(viewsBar()).getByRole('button', { name: /Guardar vista/ }));
  await user.type(within(viewsBar()).getByRole('textbox', { name: 'Nombre de la vista' }), name);
  await user.click(within(viewsBar()).getByRole('button', { name: 'Guardar' }));
}

/** Oculta la columna Monto desde el panel de configuración. */
async function hideMonto(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Columnas,/ }));
  const panel = screen.getByRole('complementary', { name: 'Configuración de columnas' });
  await user.click(within(panel).getByRole('checkbox', { name: 'Monto' }));
  await user.click(within(panel).getByRole('button', { name: 'Cerrar panel de columnas' }));
}

describe('ViewsBar', () => {
  it('avisa cuando todavía no hay vistas', () => {
    renderWithViews();

    expect(within(viewsBar()).getByText('Sin vistas guardadas')).toBeInTheDocument();
  });

  it('no aparece si la capacidad está apagada', () => {
    render(
      <AdvancedTable<DemoRow>
        tableId="sin-vistas"
        columns={DEMO_COLUMNS}
        data={buildDemoRows(5)}
        getRowId={getDemoRowId}
      />,
    );

    expect(screen.queryByRole('toolbar', { name: 'Vistas guardadas' })).not.toBeInTheDocument();
  });

  it('guarda una vista con el nombre escrito', async () => {
    const user = userEvent.setup();
    renderWithViews();

    await saveViewNamed(user, 'Mis pendientes');

    expect(within(viewsBar()).getByRole('button', { name: 'Mis pendientes' })).toBeInTheDocument();
  });

  it('marca como activa la vista recién guardada', async () => {
    const user = userEvent.setup();
    renderWithViews();

    await saveViewNamed(user, 'Mis pendientes');

    expect(within(viewsBar()).getByRole('button', { name: 'Mis pendientes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('no permite guardar sin nombre', async () => {
    const user = userEvent.setup();
    renderWithViews();

    await user.click(within(viewsBar()).getByRole('button', { name: /Guardar vista/ }));

    expect(within(viewsBar()).getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('rechaza un nombre repetido', async () => {
    const user = userEvent.setup();
    renderWithViews();

    await saveViewNamed(user, 'Repetida');
    await user.click(within(viewsBar()).getByRole('button', { name: /Guardar vista/ }));
    await user.type(
      within(viewsBar()).getByRole('textbox', { name: 'Nombre de la vista' }),
      'Repetida',
    );

    expect(within(viewsBar()).getByRole('alert')).toHaveTextContent(
      'Ya existe una vista con ese nombre',
    );
    expect(within(viewsBar()).getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('cancela sin guardar nada', async () => {
    const user = userEvent.setup();
    renderWithViews();

    await user.click(within(viewsBar()).getByRole('button', { name: /Guardar vista/ }));
    await user.type(
      within(viewsBar()).getByRole('textbox', { name: 'Nombre de la vista' }),
      'Descartada',
    );
    await user.click(within(viewsBar()).getByRole('button', { name: 'Cancelar' }));

    expect(within(viewsBar()).getByText('Sin vistas guardadas')).toBeInTheDocument();
  });

  it('elimina una vista', async () => {
    const user = userEvent.setup();
    renderWithViews();

    await saveViewNamed(user, 'Temporal');
    await user.click(
      within(viewsBar()).getByRole('button', { name: 'Eliminar la vista Temporal' }),
    );

    expect(within(viewsBar()).queryByRole('button', { name: 'Temporal' })).not.toBeInTheDocument();
  });

  describe('lo que una vista conserva', () => {
    it('devuelve las columnas guardadas al aplicarla', async () => {
      const user = userEvent.setup();
      renderWithViews();

      // Se guarda una vista sin la columna Monto...
      await hideMonto(user);
      await saveViewNamed(user, 'Sin monto');

      // ...se vuelve a mostrar a mano...
      await hideMonto(user);
      expect(screen.getByRole('columnheader', { name: /Monto/ })).toBeInTheDocument();

      // ...y aplicar la vista la oculta otra vez.
      await user.click(within(viewsBar()).getByRole('button', { name: 'Sin monto' }));

      expect(screen.queryByRole('columnheader', { name: /Monto/ })).not.toBeInTheDocument();
    });

    it('devuelve el tamaño de página guardado', async () => {
      const user = userEvent.setup();
      renderWithViews();

      await user.selectOptions(screen.getByRole('combobox', { name: 'Filas' }), '50');
      await saveViewNamed(user, 'Cincuenta');

      await user.selectOptions(screen.getByRole('combobox', { name: 'Filas' }), '10');
      expect(screen.getByText('Mostrando 1–10 de 60')).toBeInTheDocument();

      await user.click(within(viewsBar()).getByRole('button', { name: 'Cincuenta' }));

      expect(screen.getByText('Mostrando 1–50 de 60')).toBeInTheDocument();
    });

    it('vuelve a la primera página al aplicarla', async () => {
      const user = userEvent.setup();
      renderWithViews();

      await saveViewNamed(user, 'Base');
      await user.click(screen.getByRole('button', { name: 'Siguiente' }));
      expect(screen.getByText('Mostrando 26–50 de 60')).toBeInTheDocument();

      await user.click(within(viewsBar()).getByRole('button', { name: 'Base' }));

      expect(screen.getByText('Mostrando 1–25 de 60')).toBeInTheDocument();
    });
  });

  it('conserva las vistas entre montajes', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithViews('vistas-persistidas');

    await saveViewNamed(user, 'Persistente');
    unmount();

    renderWithViews('vistas-persistidas');

    expect(within(viewsBar()).getByRole('button', { name: 'Persistente' })).toBeInTheDocument();
  });

  it('no mezcla las vistas de dos tablas distintas', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithViews('tabla-a');

    await saveViewNamed(user, 'Solo de A');
    unmount();

    renderWithViews('tabla-b');

    expect(within(viewsBar()).getByText('Sin vistas guardadas')).toBeInTheDocument();
  });
});
