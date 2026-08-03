/** @vitest-environment node */
import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_TICKETS } from '../mocks/tickets.mock';
import { ticketStore } from '../mocks/ticket-store.mock';
import {
  TicketNotFoundError,
  TicketsUnavailableError,
  mockTicketProvider,
} from './mock-ticket.provider';

/**
 * El proveedor simulado cumpliendo el contrato del Repository.
 *
 * Las reglas se comprueban sobre el origen (`mocks/ticket-store.mock.spec.ts`).
 * Aquí solo lo que añade el proveedor: resolver de forma asíncrona y traducir la
 * ausencia de un ticket a un error con el que la pantalla pueda hablar.
 */

beforeEach(() => {
  ticketStore.reset();
});

describe('mockTicketProvider', () => {
  it('resuelve el listado completo', async () => {
    await expect(mockTicketProvider.list()).resolves.toHaveLength(MOCK_TICKETS.length);
  });

  it('falla con un error propio cuando se le pide', async () => {
    await expect(mockTicketProvider.list({ shouldFail: true })).rejects.toBeInstanceOf(
      TicketsUnavailableError,
    );
  });

  it('el error de disponibilidad lleva un mensaje presentable', async () => {
    await expect(mockTicketProvider.list({ shouldFail: true })).rejects.toThrow(
      /No se pudo consultar los tickets/,
    );
  });

  it('resuelve el detalle de un ticket', async () => {
    const detail = await mockTicketProvider.findDetail('3');

    expect(detail.number).toBe('INC-2026-000103');
    expect(detail.address).toContain('Medellín');
  });

  it('un identificador inexistente no es un fallo del origen', async () => {
    // Se distinguen porque la pantalla no debe invitar a reintentar algo que no
    // existe.
    await expect(mockTicketProvider.findDetail('no-existe')).rejects.toBeInstanceOf(
      TicketNotFoundError,
    );
    await expect(mockTicketProvider.findTimeline('no-existe')).rejects.toBeInstanceOf(
      TicketNotFoundError,
    );
    await expect(mockTicketProvider.findAuditLog('no-existe')).rejects.toBeInstanceOf(
      TicketNotFoundError,
    );
  });

  it('una operación sobre un ticket inexistente también avisa', async () => {
    await expect(
      mockTicketProvider.addObservation('no-existe', { note: 'Nada' }, 'Alguien'),
    ).rejects.toBeInstanceOf(TicketNotFoundError);
  });

  it('entrega los técnicos a los que se puede asignar un servicio', async () => {
    // La lista llega por el contrato, no importando el mock desde el formulario.
    const technicians = await mockTicketProvider.listAssignableTechnicians();

    expect(technicians.length).toBeGreaterThan(0);
  });

  it('propaga el rechazo del origen a adelantar el flujo', async () => {
    await expect(
      mockTicketProvider.completeWorkflowStep('3', 'finalizar-servicio', 'Alguien'),
    ).rejects.toThrow(/no es el que corresponde/);
  });
});
