import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RowActions, type RowAction } from './row-actions';

interface Row {
  id: string;
  isActive: boolean;
}

const ROW: Row = { id: 'row-1', isActive: true };

function renderActions(actions: RowAction<Row>[], row: Row = ROW) {
  return render(<RowActions row={row} actions={actions} />);
}

async function openMenu(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Acciones de la fila' }));
  return user;
}

describe('RowActions', () => {
  it('no se dibuja si no hay acciones', () => {
    renderActions([]);

    expect(screen.queryByRole('button', { name: 'Acciones de la fila' })).not.toBeInTheDocument();
  });

  it('no se dibuja si ninguna acción es visible para la fila', () => {
    renderActions([{ id: 'edit', label: 'Editar', onSelect: vi.fn(), isHidden: () => true }]);

    expect(screen.queryByRole('button', { name: 'Acciones de la fila' })).not.toBeInTheDocument();
  });

  it('lista las acciones visibles al abrir', async () => {
    renderActions([
      { id: 'edit', label: 'Editar', onSelect: vi.fn() },
      { id: 'suspend', label: 'Suspender', onSelect: vi.fn() },
    ]);
    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Suspender' })).toBeInTheDocument();
  });

  it('oculta las acciones que no aplican a la fila', async () => {
    renderActions([
      { id: 'edit', label: 'Editar', onSelect: vi.fn() },
      {
        id: 'activate',
        label: 'Activar',
        onSelect: vi.fn(),
        isHidden: (row) => row.isActive,
      },
    ]);
    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Activar' })).not.toBeInTheDocument();
  });

  it('entrega la fila a la acción seleccionada', async () => {
    const onSelect = vi.fn();
    renderActions([{ id: 'edit', label: 'Editar', onSelect }]);
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));

    expect(onSelect).toHaveBeenCalledWith(ROW);
  });

  it('deshabilita una acción sin ocultarla', async () => {
    const onSelect = vi.fn();
    renderActions([{ id: 'suspend', label: 'Suspender', onSelect, isDisabled: () => true }]);
    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'Suspender' })).toHaveAttribute('data-disabled');
  });

  it('permite personalizar el texto accesible del botón', () => {
    render(
      <RowActions
        row={ROW}
        actions={[{ id: 'edit', label: 'Editar', onSelect: vi.fn() }]}
        label="Acciones de Ana Pérez"
      />,
    );

    expect(screen.getByRole('button', { name: 'Acciones de Ana Pérez' })).toBeInTheDocument();
  });

  it('el framework no decide nada: solo dibuja lo que recibe', async () => {
    // Ninguna lógica de dominio vive en el componente; las tres acciones se
    // muestran tal cual porque la feature las declaró visibles.
    renderActions([
      { id: 'a', label: 'Uno', onSelect: vi.fn() },
      { id: 'b', label: 'Dos', onSelect: vi.fn() },
      { id: 'c', label: 'Tres', onSelect: vi.fn(), destructive: true, separatorBefore: true },
    ]);
    await openMenu();

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });
});
