import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableToolbar } from './table-toolbar';

describe('TableToolbar', () => {
  it('funciona sin ninguna sección', () => {
    render(<TableToolbar />);

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra la búsqueda cuando se configura', () => {
    render(<TableToolbar search={{ value: 'abc', onChange: vi.fn() }} />);

    expect(screen.getByRole('searchbox')).toHaveValue('abc');
  });

  it('propaga los cambios de búsqueda', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TableToolbar search={{ value: '', onChange }} />);

    await user.type(screen.getByRole('searchbox'), 'x');

    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('acepta un selector de columnas como nodo', () => {
    render(<TableToolbar columnSelector={<button type="button">Columnas</button>} />);

    expect(screen.getByRole('button', { name: 'Columnas' })).toBeInTheDocument();
  });

  it('solo ofrece restablecer si hay algo que restablecer', () => {
    render(<TableToolbar />);

    expect(screen.queryByRole('button', { name: /Restablecer/ })).not.toBeInTheDocument();
  });

  it('invoca el restablecimiento', async () => {
    const onResetPreferences = vi.fn();
    const user = userEvent.setup();
    render(<TableToolbar onResetPreferences={onResetPreferences} />);

    await user.click(screen.getByRole('button', { name: /Restablecer/ }));

    expect(onResetPreferences).toHaveBeenCalledTimes(1);
  });

  it('renderiza el contenido propio del módulo', () => {
    render(
      <TableToolbar>
        <button type="button">Exportar</button>
      </TableToolbar>,
    );

    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
  });

  it('no conoce ningún módulo: solo compone lo que recibe', () => {
    render(
      <TableToolbar
        search={{ value: '', onChange: vi.fn(), placeholder: 'Buscar activo' }}
        columnSelector={<span>selector</span>}
        onResetPreferences={vi.fn()}
      >
        <span>acciones</span>
      </TableToolbar>,
    );

    expect(screen.getByLabelText('Buscar activo')).toBeInTheDocument();
    expect(screen.getByText('selector')).toBeInTheDocument();
    expect(screen.getByText('acciones')).toBeInTheDocument();
  });
});
