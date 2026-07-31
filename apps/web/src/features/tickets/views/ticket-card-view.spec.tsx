import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Ticket } from '@redsis/contracts';
import { MOCK_TICKETS } from '../mocks/tickets.mock';
import { TicketCardView } from './ticket-card-view';
import type { TicketViewProps } from './ticket-view.types';

function renderCards(overrides: Partial<TicketViewProps> = {}) {
  const onViewDetail = overrides.onViewDetail ?? vi.fn();

  render(
    <TicketCardView
      tickets={overrides.tickets ?? MOCK_TICKETS.slice(0, 3)}
      loading={overrides.loading ?? false}
      error={overrides.error ?? null}
      onViewDetail={onViewDetail}
    />,
  );

  return { onViewDetail };
}

/** Tarjeta del primer ticket de la muestra. */
function firstCard(ticket: Ticket): HTMLElement {
  return screen.getByRole('article', { name: ticket.number });
}

describe('TicketCardView', () => {
  it('dibuja una tarjeta por ticket', () => {
    renderCards();

    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('muestra los siete datos que necesita el técnico', () => {
    const ticket = MOCK_TICKETS[0]!;
    renderCards({ tickets: [ticket] });

    const card = firstCard(ticket);

    expect(within(card).getByRole('heading', { name: ticket.number })).toBeInTheDocument();
    expect(within(card).getByText(ticket.clientName)).toBeInTheDocument();
    expect(within(card).getByText(new RegExp(ticket.branchName))).toBeInTheDocument();
    expect(within(card).getByText(new RegExp(ticket.city))).toBeInTheDocument();
    expect(within(card).getByText('Nuevo')).toBeInTheDocument();
    expect(within(card).getByText('Alta')).toBeInTheDocument();
    expect(within(card).getByText('28/7/2026')).toBeInTheDocument();
  });

  it('nombra al técnico asignado', () => {
    const ticket = MOCK_TICKETS.find((candidate) => candidate.technicianName !== null)!;
    renderCards({ tickets: [ticket] });

    expect(within(firstCard(ticket)).getByText(ticket.technicianName!)).toBeInTheDocument();
  });

  it('avisa cuando el ticket no tiene técnico', () => {
    const ticket = MOCK_TICKETS.find((candidate) => candidate.technicianName === null)!;
    renderCards({ tickets: [ticket] });

    expect(within(firstCard(ticket)).getByText('Sin técnico')).toBeInTheDocument();
  });

  it('pide el detalle del ticket pulsado', async () => {
    const user = userEvent.setup();
    const ticket = MOCK_TICKETS[0]!;
    const { onViewDetail } = renderCards({ tickets: [ticket] });

    await user.click(within(firstCard(ticket)).getByRole('button', { name: 'Ver detalle' }));

    expect(onViewDetail).toHaveBeenCalledWith(ticket);
  });

  it('no ofrece editar ni actuar sobre el ticket', () => {
    const ticket = MOCK_TICKETS[0]!;
    renderCards({ tickets: [ticket] });

    // Solo "Ver detalle": la edición desde tarjetas no está implementada.
    expect(within(firstCard(ticket)).getAllByRole('button')).toHaveLength(1);
  });

  describe('estados excepcionales', () => {
    it('muestra que está cargando', () => {
      renderCards({ loading: true, tickets: [] });

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });

    it('muestra el error del origen de datos', () => {
      renderCards({ error: new Error('El origen no responde'), tickets: [] });

      expect(screen.getByText('El origen no responde')).toBeInTheDocument();
    });

    it('prioriza el error sobre los datos antiguos en pantalla', () => {
      renderCards({ error: new Error('Falló'), tickets: MOCK_TICKETS.slice(0, 2) });

      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });

    it('avisa cuando no hay tickets', () => {
      renderCards({ tickets: [] });

      expect(screen.getByText('No hay tickets asignados.')).toBeInTheDocument();
    });
  });
});
