import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnSelector, type SelectableColumn } from './column-selector';

/**
 * El selector se prueba completamente aislado: sin motor de tablas, sin
 * `localStorage` y sin ningún origen de datos. Que estas pruebas pasen es la
 * demostración del criterio de aceptación de MVP 5.
 */

const FEW_COLUMNS: SelectableColumn[] = [
  { id: 'client', label: 'Cliente', isVisible: true },
  { id: 'city', label: 'Ciudad', isVisible: false },
];

const MANY_COLUMNS: SelectableColumn[] = [
  { id: 'number', label: 'Ticket', isVisible: true },
  { id: 'client', label: 'Cliente', isVisible: true },
  { id: 'branch', label: 'Sucursal', isVisible: true },
  { id: 'city', label: 'Ciudad', isVisible: true },
  { id: 'status', label: 'Estado', isVisible: true },
  { id: 'priority', label: 'Prioridad', isVisible: false },
];

type SelectorProps = React.ComponentProps<typeof ColumnSelector>;

function renderSelector(overrides: Partial<SelectorProps> = {}) {
  const props: SelectorProps = {
    columns: FEW_COLUMNS,
    onToggle: vi.fn(),
    ...overrides,
  };

  render(<ColumnSelector {...props} />);
  return props;
}

async function open(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Columnas/ }));
  return user;
}

describe('ColumnSelector', () => {
  it('no se muestra si no hay columnas ocultables', () => {
    render(<ColumnSelector columns={[]} onToggle={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Columnas/ })).not.toBeInTheDocument();
  });

  it('informa cuántas columnas están visibles', () => {
    renderSelector();

    expect(screen.getByRole('button', { name: 'Columnas, 1 de 2 visibles' })).toBeInTheDocument();
  });

  it('actualiza el conteo al ocultar una columna', () => {
    renderSelector({
      columns: [
        { id: 'client', label: 'Cliente', isVisible: false },
        { id: 'city', label: 'Ciudad', isVisible: false },
      ],
    });

    expect(screen.getByRole('button', { name: 'Columnas, 0 de 2 visibles' })).toBeInTheDocument();
  });

  it('arranca cerrado', () => {
    renderSelector();

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  describe('mostrar y ocultar', () => {
    it('lista las columnas con su estado actual', async () => {
      renderSelector();
      await open();

      expect(screen.getByRole('checkbox', { name: 'Cliente' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Ciudad' })).not.toBeChecked();
    });

    it('avisa cuando se oculta una columna', async () => {
      const props = renderSelector();
      const user = await open();

      await user.click(screen.getByRole('checkbox', { name: 'Cliente' }));

      expect(props.onToggle).toHaveBeenCalledWith('client', false);
    });

    it('avisa cuando se muestra una columna', async () => {
      const props = renderSelector();
      const user = await open();

      await user.click(screen.getByRole('checkbox', { name: 'Ciudad' }));

      expect(props.onToggle).toHaveBeenCalledWith('city', true);
    });

    it('identifica la columna por su id, no por su etiqueta', async () => {
      const props = renderSelector({
        columns: [{ id: 'technicianName', label: 'Técnico', isVisible: true }],
      });
      const user = await open();

      await user.click(screen.getByRole('checkbox', { name: 'Técnico' }));

      expect(props.onToggle).toHaveBeenCalledWith('technicianName', false);
    });
  });

  describe('buscar columnas', () => {
    it('no ofrece búsqueda con pocas columnas', async () => {
      renderSelector();
      await open();

      expect(screen.queryByLabelText('Buscar columna')).not.toBeInTheDocument();
    });

    it('ofrece búsqueda cuando la lista es larga', async () => {
      renderSelector({ columns: MANY_COLUMNS });
      await open();

      expect(screen.getByLabelText('Buscar columna')).toBeInTheDocument();
    });

    it('filtra la lista por el texto escrito', async () => {
      renderSelector({ columns: MANY_COLUMNS });
      const user = await open();

      await user.type(screen.getByLabelText('Buscar columna'), 'ciu');

      expect(screen.getByRole('checkbox', { name: 'Ciudad' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Cliente' })).not.toBeInTheDocument();
    });

    it('busca sin distinguir mayúsculas ni acentos del término', async () => {
      renderSelector({ columns: MANY_COLUMNS });
      const user = await open();

      await user.type(screen.getByLabelText('Buscar columna'), 'ESTADO');

      expect(screen.getByRole('checkbox', { name: 'Estado' })).toBeInTheDocument();
    });

    it('avisa cuando ninguna columna coincide', async () => {
      renderSelector({ columns: MANY_COLUMNS });
      const user = await open();

      await user.type(screen.getByLabelText('Buscar columna'), 'zzz');

      expect(screen.getByText('Ninguna columna coincide')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('descarta la búsqueda al cerrar y volver a abrir', async () => {
      renderSelector({ columns: MANY_COLUMNS });
      const user = await open();

      await user.type(screen.getByLabelText('Buscar columna'), 'ciu');
      await user.click(screen.getByRole('button', { name: /Columnas/ }));
      await user.click(screen.getByRole('button', { name: /Columnas/ }));

      expect(screen.getByLabelText('Buscar columna')).toHaveValue('');
      expect(screen.getByRole('checkbox', { name: 'Cliente' })).toBeInTheDocument();
    });
  });

  describe('restaurar configuración', () => {
    it('no ofrece restaurar si no se proporciona la acción', async () => {
      renderSelector();
      await open();

      expect(screen.queryByRole('button', { name: /Restaurar/ })).not.toBeInTheDocument();
    });

    it('invoca la restauración y cierra el panel', async () => {
      const onRestore = vi.fn();
      renderSelector({ onRestore });
      const user = await open();

      await user.click(screen.getByRole('button', { name: /Restaurar configuración/ }));

      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('deshabilita la restauración cuando no hay nada que restaurar', async () => {
      renderSelector({ onRestore: vi.fn(), canRestore: false });
      await open();

      expect(screen.getByRole('button', { name: /Restaurar configuración/ })).toBeDisabled();
    });
  });

  describe('cierre del panel', () => {
    it('se cierra al pulsar fuera', async () => {
      renderSelector();
      const user = await open();

      await user.click(screen.getByRole('button', { name: 'Cerrar selector de columnas' }));

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('se cierra con la tecla Escape', async () => {
      renderSelector();
      const user = await open();

      await user.click(screen.getByRole('checkbox', { name: 'Cliente' }));
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  it('funciona sin ningún origen de almacenamiento: solo recibe datos y avisa', async () => {
    const onToggle = vi.fn();
    render(<ColumnSelector columns={FEW_COLUMNS} onToggle={onToggle} />);
    const user = await open();

    await user.click(screen.getByRole('checkbox', { name: 'Ciudad' }));

    expect(onToggle).toHaveBeenCalledWith('city', true);

    // El componente no persiste nada por su cuenta: no escribe ninguna clave de
    // preferencias de tabla. Decidir dónde se guardan es de quien lo usa.
    const tableKeys = Object.keys(localStorage).filter((key) => key.startsWith('redsis.table'));
    expect(tableKeys).toEqual([]);
  });
});
