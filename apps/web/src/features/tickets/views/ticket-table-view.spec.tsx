import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCK_TICKETS } from '../mocks/tickets.mock';
import { TicketTableView } from './ticket-table-view';

function renderTable() {
  const onViewDetail = vi.fn();

  render(
    <TicketTableView
      tickets={MOCK_TICKETS}
      loading={false}
      error={null}
      onViewDetail={onViewDetail}
    />,
  );

  return { onViewDetail };
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
});
