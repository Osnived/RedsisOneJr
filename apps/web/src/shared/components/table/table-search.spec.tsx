import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableSearch } from './table-search';

describe('TableSearch', () => {
  it('muestra el valor recibido', () => {
    render(<TableSearch value="ticket-123" onChange={vi.fn()} />);

    expect(screen.getByRole('searchbox')).toHaveValue('ticket-123');
  });

  it('avisa de cada pulsación', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TableSearch value="" onChange={onChange} />);

    await user.type(screen.getByRole('searchbox'), 'ab');

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('usa el texto de ayuda como etiqueta accesible', () => {
    render(<TableSearch value="" onChange={vi.fn()} placeholder="Buscar sucursal" />);

    expect(screen.getByLabelText('Buscar sucursal')).toBeInTheDocument();
  });

  it('no ofrece limpiar cuando está vacío', () => {
    render(<TableSearch value="" onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).not.toBeInTheDocument();
  });

  it('limpia el campo en un clic', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TableSearch value="algo" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('se puede deshabilitar', () => {
    render(<TableSearch value="" onChange={vi.fn()} disabled />);

    expect(screen.getByRole('searchbox')).toBeDisabled();
  });
});
