import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCK_TICKETS } from '@/test/ticket-fixtures';
import { ticketColumns } from '../columns/ticket.columns';
import { TicketTableView } from './ticket-table-view';

function renderTable() {
  const onViewDetail = vi.fn();
  const onQueryChange = vi.fn();

  render(
    <TicketTableView
      tickets={MOCK_TICKETS}
      columns={ticketColumns}
      totalRows={MOCK_TICKETS.length}
      loading={false}
      error={null}
      onQueryChange={onQueryChange}
      onViewDetail={onViewDetail}
    />,
  );

  return { onViewDetail, onQueryChange };
}

const FIRST_TICKET = MOCK_TICKETS[0]!;

describe('TicketTableView', () => {
  it('lleva al ticket al pulsar su fila', async () => {
    const user = userEvent.setup();
    const { onViewDetail } = renderTable();

    await user.click(screen.getByRole('row', { name: `Abrir el ticket ${FIRST_TICKET.number}` }));

    expect(onViewDetail).toHaveBeenCalledWith(FIRST_TICKET);
  });

  it('no ofrece acciones sobre la fila', () => {
    renderTable();

    // La tabla solo sirve para localizar un ticket: toda la operación ocurre en
    // su pantalla.
    expect(screen.queryByRole('button', { name: /^Acciones/ })).not.toBeInTheDocument();
  });

  it('conserva las capacidades avanzadas', () => {
    renderTable();

    expect(screen.getByRole('toolbar', { name: 'Vistas guardadas' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Agrupar por' })).toBeInTheDocument();
  });

  it('avisa de la consulta en lugar de resolverla', async () => {
    // En modo servidor la tabla no filtra ni pagina: pide. Si resolviera por su
    // cuenta, mostraría solo lo que cabe en la página actual como si fuera todo.
    const user = userEvent.setup();
    const { onQueryChange } = renderTable();

    await user.type(screen.getByRole('searchbox'), 'banco');

    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalled();
    });

    const lastCall = onQueryChange.mock.calls.at(-1)?.[0] as { search: string } | undefined;

    expect(lastCall?.search).toBe('banco');
  });
});
