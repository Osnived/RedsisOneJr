import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ROW_ACTIONS_COLUMN_ID } from '@/types/table';
import { DataTable } from './data-table';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';

type DataTableTestProps = Partial<React.ComponentProps<typeof DataTable<DemoRow>>>;

function renderTable(overrides: DataTableTestProps = {}) {
  return render(
    <DataTable<DemoRow>
      tableId={overrides.tableId ?? 'demo'}
      columns={DEMO_COLUMNS}
      data={overrides.data ?? buildDemoRows(60)}
      getRowId={getDemoRowId}
      {...overrides}
    />,
  );
}

/** Filas del cuerpo, sin contar la cabecera. */
function bodyRows(): HTMLElement[] {
  const [, ...rows] = screen.getAllByRole('row');
  return rows;
}

describe('DataTable', () => {
  it('muestra las columnas visibles y oculta las que arrancan ocultas', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: /Nombre/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Monto/ })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Notas/ })).not.toBeInTheDocument();
  });

  it('muestra la primera página de filas', () => {
    renderTable();

    expect(bodyRows()).toHaveLength(25);
    expect(screen.getByText('Registro 001')).toBeInTheDocument();
    expect(screen.queryByText('Registro 026')).not.toBeInTheDocument();
  });

  it('informa el rango y el total de registros', () => {
    renderTable();

    expect(screen.getByText('Mostrando 1–25 de 60')).toBeInTheDocument();
  });

  it('formatea los booleanos con el formato del framework', () => {
    renderTable({ data: buildDemoRows(1) });

    expect(screen.getByText('Sí')).toBeInTheDocument();
  });

  describe('estados excepcionales', () => {
    it('muestra el esqueleto de carga', () => {
      renderTable({ loading: true, data: [] });

      expect(screen.getByText('Cargando registros...')).toBeInTheDocument();
    });

    it('muestra el mensaje del Error recibido', () => {
      renderTable({ error: new Error('No se pudo consultar'), data: [] });

      expect(screen.getByText('No se pudo consultar')).toBeInTheDocument();
    });

    it('acepta cualquier subclase de Error', () => {
      class DataSourceError extends Error {}

      renderTable({ error: new DataSourceError('Origen no disponible'), data: [] });

      expect(screen.getByText('Origen no disponible')).toBeInTheDocument();
    });

    it('muestra el error aunque haya filas cargadas', () => {
      renderTable({ error: new Error('Fallo al refrescar') });

      expect(screen.getByText('Fallo al refrescar')).toBeInTheDocument();
      expect(screen.queryByText('Registro 001')).not.toBeInTheDocument();
    });

    it('prioriza la carga sobre el mensaje de vacío', () => {
      renderTable({ loading: true, data: [] });

      expect(screen.queryByText('No hay registros para mostrar')).not.toBeInTheDocument();
    });

    it('muestra el mensaje de vacío por defecto', () => {
      renderTable({ data: [] });

      expect(screen.getByText('No hay registros para mostrar')).toBeInTheDocument();
    });

    it('permite personalizar el mensaje de vacío', () => {
      renderTable({ data: [], emptyMessage: 'Sin tickets asignados' });

      expect(screen.getByText('Sin tickets asignados')).toBeInTheDocument();
    });
  });

  describe('ordenamiento', () => {
    it('ordena al pulsar la cabecera', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'orden-ui' });

      await user.click(screen.getByRole('button', { name: /Monto/ }));

      const firstRow = bodyRows()[0];
      expect(within(firstRow as HTMLElement).getByText('10')).toBeInTheDocument();
    });

    it('anuncia la dirección del orden para lectores de pantalla', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'orden-aria' });

      const header = screen.getByRole('columnheader', { name: /Monto/ });
      expect(header).toHaveAttribute('aria-sort', 'none');

      await user.click(screen.getByRole('button', { name: /Monto/ }));

      expect(screen.getByRole('columnheader', { name: /Monto/ })).toHaveAttribute(
        'aria-sort',
        'ascending',
      );
    });

    it('no permite ordenar una columna declarada sin orden', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'orden-bloqueado' });

      await user.click(screen.getByRole('button', { name: 'Columnas' }));
      await user.click(screen.getByRole('checkbox', { name: 'Notas' }));

      expect(screen.queryByRole('button', { name: /Notas/ })).not.toBeInTheDocument();
    });
  });

  describe('búsqueda', () => {
    it('filtra las filas mostradas', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'busqueda' });

      await user.type(screen.getByRole('searchbox'), 'Registro 007');

      expect(bodyRows()).toHaveLength(1);
    });

    it('se puede desactivar', () => {
      renderTable({ enableSearch: false });

      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
  });

  describe('paginación', () => {
    it('deshabilita Anterior en la primera página', () => {
      renderTable();

      expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
    });

    it('avanza a la página siguiente', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'paginacion' });

      await user.click(screen.getByRole('button', { name: 'Siguiente' }));

      expect(screen.getByText('Registro 026')).toBeInTheDocument();
      expect(screen.getByText('Mostrando 26–50 de 60')).toBeInTheDocument();
    });

    it('cambia el tamaño de página', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'tamano-pagina' });

      await user.selectOptions(screen.getByLabelText('Filas'), '50');

      expect(bodyRows()).toHaveLength(50);
    });
  });

  describe('selector de columnas', () => {
    it('permite mostrar una columna oculta', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'columnas' });

      await user.click(screen.getByRole('button', { name: 'Columnas' }));
      await user.click(screen.getByRole('checkbox', { name: 'Notas' }));

      expect(screen.getByRole('columnheader', { name: /Notas/ })).toBeInTheDocument();
    });

    it('no lista las columnas imprescindibles', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'columnas-fijas' });

      await user.click(screen.getByRole('button', { name: 'Columnas' }));

      expect(screen.queryByRole('checkbox', { name: 'Nombre' })).not.toBeInTheDocument();
    });
  });

  describe('restablecer preferencias', () => {
    it('no ofrece restablecer si el usuario no ha cambiado nada', () => {
      renderTable({ tableId: 'sin-ajustes' });

      expect(screen.queryByRole('button', { name: /Restablecer/ })).not.toBeInTheDocument();
    });

    it('aparece tras cambiar un ajuste y lo deshace', async () => {
      const user = userEvent.setup();
      renderTable({ tableId: 'con-ajustes' });

      await user.selectOptions(screen.getByLabelText('Filas'), '50');
      expect(bodyRows()).toHaveLength(50);

      await user.click(screen.getByRole('button', { name: /Restablecer/ }));

      expect(bodyRows()).toHaveLength(25);
    });
  });

  describe('modo servidor', () => {
    it('muestra el total que informa el backend', () => {
      renderTable({
        tableId: 'servidor-ui',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
      });

      expect(screen.getByText('Mostrando 1–10 de 240')).toBeInTheDocument();
      expect(bodyRows()).toHaveLength(10);
    });

    it('avisa del cambio de página en lugar de paginar en el cliente', async () => {
      const user = userEvent.setup();
      const onQueryChange = vi.fn();

      renderTable({
        tableId: 'servidor-ui-pagina',
        mode: 'server',
        data: buildDemoRows(10),
        totalRows: 240,
        onQueryChange,
      });

      await user.click(screen.getByRole('button', { name: 'Siguiente' }));

      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  describe('API pública', () => {
    it('permite inyectar contenido propio del módulo en la barra superior', () => {
      renderTable({ toolbar: <button type="button">Nuevo ticket</button> });

      expect(screen.getByRole('button', { name: 'Nuevo ticket' })).toBeInTheDocument();
    });

    it('renderiza las acciones de fila recibiendo la fila correspondiente', () => {
      renderTable({
        data: buildDemoRows(2),
        rowActions: (row) => <button type="button">Ver {row.name}</button>,
      });

      expect(screen.getByRole('button', { name: 'Ver Registro 001' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ver Registro 002' })).toBeInTheDocument();
    });

    it('no añade la columna de acciones si el módulo no las declara', () => {
      renderTable({ data: buildDemoRows(1) });

      // Solo las tres columnas visibles declaradas por el módulo.
      const headerRow = screen.getAllByRole('row')[0];
      expect(within(headerRow as HTMLElement).getAllByRole('columnheader')).toHaveLength(3);
    });

    it('no permite ocultar la columna de acciones', async () => {
      const user = userEvent.setup();
      renderTable({
        tableId: 'acciones-fijas',
        data: buildDemoRows(1),
        rowActions: () => <button type="button">Ver</button>,
      });

      await user.click(screen.getByRole('button', { name: 'Columnas' }));

      // El panel lista las tres columnas de datos ocultables (Monto, Activo,
      // Notas) y nunca la de acciones: ocultarla dejaría al usuario sin acceso
      // a ellas sin explicación.
      const listadas = screen.getAllByRole('checkbox').map((input) => input.getAttribute('name'));
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      expect(listadas).not.toContain(ROW_ACTIONS_COLUMN_ID);
      expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    });

    it('funciona con un tipo de dato cualquiera sin modificar el componente', () => {
      interface Equipo {
        serial: string;
        modelo: string;
      }

      const columnas = [
        { id: 'serial', header: 'Serial', accessor: (row: Equipo) => row.serial },
        { id: 'modelo', header: 'Modelo', accessor: (row: Equipo) => row.modelo },
      ];

      render(
        <DataTable<Equipo>
          tableId="equipos"
          columns={columnas}
          data={[{ serial: 'SN-1', modelo: 'Impresora X' }]}
          getRowId={(row) => row.serial}
        />,
      );

      expect(screen.getByText('SN-1')).toBeInTheDocument();
      expect(screen.getByText('Impresora X')).toBeInTheDocument();
    });
  });
});
