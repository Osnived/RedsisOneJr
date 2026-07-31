import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTableColumnSettings, useTableContext } from '@/shared/hooks/table/use-table-context';
import { DEMO_COLUMNS, buildDemoRows, getDemoRowId, type DemoRow } from '@/test/table-fixtures';
import { TableProvider } from './table-provider';

function renderWithProvider(children: React.ReactNode, tableId = 'proveedor') {
  return render(
    <TableProvider<DemoRow>
      tableId={tableId}
      columns={DEMO_COLUMNS}
      data={buildDemoRows(3)}
      getRowId={getDemoRowId}
    >
      {children}
    </TableProvider>,
  );
}

/** Consumidor mínimo: lista las columnas ocultables y permite alternarlas. */
function ColumnList({ label }: { label: string }): React.JSX.Element {
  const { columns, toggle } = useTableColumnSettings();

  return (
    <ul aria-label={label}>
      {columns.map((column) => (
        <li key={column.id}>
          <button type="button" onClick={() => toggle(column.id, !column.isVisible)}>
            {`${label}: ${column.label} ${column.isVisible ? 'visible' : 'oculta'}`}
          </button>
        </li>
      ))}
    </ul>
  );
}

describe('TableProvider', () => {
  it('falla de forma explícita fuera del proveedor', () => {
    function Huerfano(): React.JSX.Element {
      useTableContext<DemoRow>();
      return <p>nunca se dibuja</p>;
    }

    // React registra el error en consola además de propagarlo.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Huerfano />)).toThrow(/TableProvider/);
  });

  it('publica la instancia del motor a su subárbol', () => {
    function Resumen(): React.JSX.Element {
      const { table } = useTableContext<DemoRow>();
      return <p>{`Filas: ${table.getRowModel().rows.length}`}</p>;
    }

    renderWithProvider(<Resumen />);

    expect(screen.getByText('Filas: 3')).toBeInTheDocument();
  });

  it('comparte un solo estado entre consumidores hermanos', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ColumnList label="uno" />
        <ColumnList label="dos" />
      </>,
    );

    // Es la razón de ser del proveedor: el panel lateral y la tabla son
    // hermanos y deben ver exactamente el mismo estado de columnas.
    await user.click(screen.getByRole('button', { name: 'uno: Monto visible' }));

    expect(screen.getByRole('button', { name: 'dos: Monto oculta' })).toBeInTheDocument();
  });
});

describe('useTableColumnSettings', () => {
  it('lista solo las columnas que se pueden ocultar', () => {
    renderWithProvider(<ColumnList label="columnas" />);

    // Nombre está declarada como no ocultable.
    expect(screen.queryByRole('button', { name: /Nombre/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'columnas: Monto visible' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'columnas: Activo visible' })).toBeInTheDocument();
  });

  it('refleja las columnas ocultas desde el inicio', () => {
    renderWithProvider(<ColumnList label="columnas" />);

    expect(screen.getByRole('button', { name: 'columnas: Notas oculta' })).toBeInTheDocument();
  });

  it('persiste el cambio bajo el identificador de la tabla', async () => {
    const user = userEvent.setup();

    renderWithProvider(<ColumnList label="columnas" />, 'tabla-persistida');

    await user.click(screen.getByRole('button', { name: 'columnas: Activo visible' }));

    const stored = localStorage.getItem('redsis.table.tabla-persistida');

    expect(stored).toContain('"active":false');
  });
});
