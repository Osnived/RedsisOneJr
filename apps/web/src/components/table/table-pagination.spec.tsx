import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablePagination } from './table-pagination';

type PaginationProps = React.ComponentProps<typeof TablePagination>;

function renderPagination(overrides: Partial<PaginationProps> = {}) {
  const props: PaginationProps = {
    page: 1,
    pageCount: 3,
    pageSize: 25,
    totalRows: 60,
    rowsOnPage: 25,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };

  render(<TablePagination {...props} />);
  return props;
}

describe('TablePagination', () => {
  it('informa el rango y el total', () => {
    renderPagination();

    expect(screen.getByText('Mostrando 1–25 de 60')).toBeInTheDocument();
  });

  it('calcula el rango de una página intermedia', () => {
    renderPagination({ page: 2 });

    expect(screen.getByText('Mostrando 26–50 de 60')).toBeInTheDocument();
  });

  it('calcula el rango de una última página incompleta', () => {
    renderPagination({ page: 3, rowsOnPage: 10 });

    expect(screen.getByText('Mostrando 51–60 de 60')).toBeInTheDocument();
  });

  it('refleja el total del servidor aunque lleguen menos filas', () => {
    renderPagination({ rowsOnPage: 10, totalRows: 240, pageCount: 10 });

    expect(screen.getByText('Mostrando 1–10 de 240')).toBeInTheDocument();
  });

  it('indica cuando no hay registros', () => {
    renderPagination({ rowsOnPage: 0, totalRows: 0, pageCount: 0 });

    expect(screen.getByText('Sin registros')).toBeInTheDocument();
    expect(screen.getByText('0 de 0')).toBeInTheDocument();
  });

  it('deshabilita Anterior en la primera página', () => {
    renderPagination({ page: 1 });

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('deshabilita Siguiente en la última página', () => {
    renderPagination({ page: 3 });

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('pide la página siguiente en base 1', async () => {
    const user = userEvent.setup();
    const props = renderPagination({ page: 2 });

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(props.onPageChange).toHaveBeenCalledWith(3);
  });

  it('pide la página anterior en base 1', async () => {
    const user = userEvent.setup();
    const props = renderPagination({ page: 2 });

    await user.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('avisa del nuevo tamaño de página como número', async () => {
    const user = userEvent.setup();
    const props = renderPagination();

    await user.selectOptions(screen.getByLabelText('Filas'), '50');

    expect(props.onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('permite acotar las opciones de tamaño de página', () => {
    renderPagination({ pageSizeOptions: [10, 20] });

    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});
