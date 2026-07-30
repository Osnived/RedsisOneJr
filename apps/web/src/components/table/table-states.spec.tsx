import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableEmptyState } from './table-empty-state';
import { TableErrorState } from './table-error-state';
import { TableSkeleton } from './table-skeleton';

/** Los tres estados son `tbody`, así que deben montarse dentro de una tabla. */
function renderInTable(children: React.ReactNode) {
  return render(<table>{children}</table>);
}

describe('TableSkeleton', () => {
  it('dibuja el número de filas solicitado', () => {
    renderInTable(<TableSkeleton columnCount={3} rowCount={4} />);

    // Las filas de relleno más la fila oculta para lectores de pantalla.
    expect(screen.getAllByRole('row', { hidden: true })).toHaveLength(5);
  });

  it('respeta el número de columnas', () => {
    renderInTable(<TableSkeleton columnCount={3} rowCount={1} />);

    const cells = screen.getAllByRole('cell', { hidden: true });
    // 3 celdas de relleno más la celda del aviso accesible.
    expect(cells).toHaveLength(4);
  });

  it('anuncia la carga a los lectores de pantalla', () => {
    renderInTable(<TableSkeleton columnCount={2} />);

    expect(screen.getByText('Cargando registros...')).toBeInTheDocument();
  });

  it('marca el cuerpo como ocupado', () => {
    const { container } = renderInTable(<TableSkeleton columnCount={2} />);

    expect(container.querySelector('tbody')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('TableEmptyState', () => {
  it('usa un mensaje por defecto', () => {
    renderInTable(<TableEmptyState columnCount={3} />);

    expect(screen.getByText('No hay registros para mostrar')).toBeInTheDocument();
  });

  it('permite personalizar el mensaje', () => {
    renderInTable(<TableEmptyState columnCount={3} message="Sin equipos registrados" />);

    expect(screen.getByText('Sin equipos registrados')).toBeInTheDocument();
  });

  it('muestra una aclaración cuando se proporciona', () => {
    renderInTable(<TableEmptyState columnCount={3} description="Ajusta los filtros" />);

    expect(screen.getByText('Ajusta los filtros')).toBeInTheDocument();
  });

  it('admite una acción sugerida', () => {
    renderInTable(
      <TableEmptyState columnCount={3} action={<button type="button">Crear el primero</button>} />,
    );

    expect(screen.getByRole('button', { name: 'Crear el primero' })).toBeInTheDocument();
  });

  it('no se anuncia como alerta: una tabla vacía no es un fallo', () => {
    renderInTable(<TableEmptyState columnCount={3} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ocupa todas las columnas', () => {
    renderInTable(<TableEmptyState columnCount={4} />);

    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '4');
  });
});

describe('TableErrorState', () => {
  it('muestra el mensaje recibido', () => {
    renderInTable(<TableErrorState columnCount={3} message="Origen no disponible" />);

    expect(screen.getByText('Origen no disponible')).toBeInTheDocument();
  });

  it('se anuncia como alerta', () => {
    renderInTable(<TableErrorState columnCount={3} message="Fallo" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('no ofrece reintentar si no hay forma de hacerlo', () => {
    renderInTable(<TableErrorState columnCount={3} message="Fallo" />);

    expect(screen.queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument();
  });

  it('invoca el reintento cuando se proporciona', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderInTable(<TableErrorState columnCount={3} message="Fallo" onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
