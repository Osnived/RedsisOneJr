import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  TICKET_AUDIT_FIELDS,
  TICKET_EVENT_KINDS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WORKFLOW_STEPS,
  dataQuerySchema,
  type TicketStatus,
} from '@redsis/contracts';
import { MockTicketProvider } from './providers/mock-ticket.provider';
import { TicketProviderRegistry } from './ticket-provider.registry';
import { TicketsService, type TicketActor } from './tickets.service';

/**
 * Las reglas del ticket se ejercitan contra el proveedor simulado real y no
 * contra un doble: lo que se comprueba es que la regla y el guardado encajan, y
 * un doble que devolviera lo que se le pide no comprobaría nada de eso.
 */
describe('TicketsService', () => {
  let module: TestingModule;
  let service: TicketsService;
  let provider: MockTicketProvider;

  const ACTOR: TicketActor = { id: 'user-1', name: 'coordinador@redsis.com' };

  afterEach(async () => {
    await module.close();
  });

  beforeEach(async () => {
    provider = new MockTicketProvider();

    module = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TicketProviderRegistry, useValue: { active: () => provider } },
      ],
    }).compile();

    service = module.get(TicketsService);
  });

  /** Un ticket cualquiera que esté en el estado que la prueba necesita. */
  async function ticketInStatus(status: TicketStatus): Promise<string> {
    const { items } = await service.list(dataQuerySchema.parse({ pageSize: 100 }));
    const found = items.find((ticket) => ticket.status === status);

    if (found === undefined) {
      throw new Error(`Los datos de prueba deberían incluir un ticket ${status}.`);
    }

    return found.id;
  }

  describe('consulta', () => {
    it('entrega la página pedida y el total de los que existen', async () => {
      const result = await service.list(dataQuerySchema.parse({ page: 1, pageSize: 10 }));

      expect(result.items).toHaveLength(10);
      expect(result.total).toBeGreaterThan(10);
      expect(result.totalPages).toBe(Math.ceil(result.total / 10));
    });

    it('un identificador desconocido no existe, no es un fallo del origen', async () => {
      await expect(service.findDetail('no-existe')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.findTimeline('no-existe')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.findAuditLog('no-existe')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('la estructura de columnas no revela nada del proveedor', async () => {
      const columns = await service.describeColumns();

      expect(columns.length).toBeGreaterThan(0);

      for (const column of columns) {
        expect(column).not.toHaveProperty('providerFieldId');
      }
    });
  });

  describe('asignación de técnico', () => {
    it('un ticket nuevo con técnico queda asignado', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);

      const detail = await service.assignTechnician(
        ticketId,
        { technicianName: 'Ana Pérez' },
        ACTOR,
      );

      expect(detail.technicianName).toBe('Ana Pérez');
      expect(detail.status).toBe(TICKET_STATUSES.ASSIGNED);
    });

    it('audita el técnico y el estado como dos cambios distintos', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);
      const before = (await service.findAuditLog(ticketId)).length;

      await service.assignTechnician(ticketId, { technicianName: 'Ana Pérez' }, ACTOR);
      const audit = await service.findAuditLog(ticketId);

      expect(audit).toHaveLength(before + 2);
      expect(audit.map((change) => change.field)).toEqual(
        expect.arrayContaining([TICKET_AUDIT_FIELDS.TECHNICIAN, TICKET_AUDIT_FIELDS.STATUS]),
      );
    });

    it('reasignar cuenta de quién a quién', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.ASSIGNED);
      const previous = (await service.findDetail(ticketId)).technicianName;

      await service.assignTechnician(ticketId, { technicianName: 'Marta Díaz' }, ACTOR);
      const timeline = await service.findTimeline(ticketId);
      const last = timeline.at(-1);

      expect(last?.kind).toBe(TICKET_EVENT_KINDS.ASSIGNED);
      expect(last?.description).toContain(`de ${previous} a Marta Díaz`);
    });

    it('un ticket ya asignado no vuelve a cambiar de estado', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.ON_ROUTE);

      const detail = await service.assignTechnician(
        ticketId,
        { technicianName: 'Luis Gómez' },
        ACTOR,
      );

      expect(detail.status).toBe(TICKET_STATUSES.ON_ROUTE);
    });

    it('el actor del rastro es quien ejecuta, no un dato de entrada', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);

      await service.assignTechnician(ticketId, { technicianName: 'Ana Pérez' }, ACTOR);
      const timeline = await service.findTimeline(ticketId);

      expect(timeline.at(-1)?.userName).toBe(ACTOR.name);
    });
  });

  describe('cambio de prioridad', () => {
    it('deja rastro en el timeline y en la auditoría', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);
      const audited = (await service.findAuditLog(ticketId)).length;

      const detail = await service.changePriority(
        ticketId,
        { priority: TICKET_PRIORITIES.CRITICAL },
        ACTOR,
      );

      expect(detail.priority).toBe(TICKET_PRIORITIES.CRITICAL);
      expect(await service.findAuditLog(ticketId)).toHaveLength(audited + 1);
    });

    it('asignar la prioridad que ya tenía no deja rastro', async () => {
      // Una auditoría llena de cambios que no cambiaron nada deja de servir para
      // auditar.
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);
      const current = (await service.findDetail(ticketId)).priority;
      const audited = (await service.findAuditLog(ticketId)).length;
      const events = (await service.findTimeline(ticketId)).length;

      await service.changePriority(ticketId, { priority: current }, ACTOR);

      expect(await service.findAuditLog(ticketId)).toHaveLength(audited);
      expect(await service.findTimeline(ticketId)).toHaveLength(events);
    });
  });

  describe('observación', () => {
    it('va al timeline y no a la auditoría', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);
      const audited = (await service.findAuditLog(ticketId)).length;

      await service.addObservation(ticketId, { note: 'El cliente pide llamar antes' }, ACTOR);

      expect(await service.findAuditLog(ticketId)).toHaveLength(audited);
      expect((await service.findTimeline(ticketId)).at(-1)?.description).toBe(
        'El cliente pide llamar antes',
      );
    });
  });

  describe('flujo de la intervención', () => {
    it('acepta el paso que corresponde y lo registra', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.ASSIGNED);

      const detail = await service.completeWorkflowStep(
        ticketId,
        TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
        ACTOR,
      );

      expect(detail.completedSteps).toContain(TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE);
    });

    it('rechaza un paso adelantado aunque la interfaz lo pidiera', async () => {
      // Quien decide qué transición es válida es quien guarda los datos, no quien
      // dibuja el botón.
      const ticketId = await ticketInStatus(TICKET_STATUSES.ASSIGNED);

      await expect(
        service.completeWorkflowStep(ticketId, TICKET_WORKFLOW_STEPS.FINISH_SERVICE, ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('salir hacia la sucursal pone el servicio en ruta', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.ASSIGNED);

      await service.completeWorkflowStep(ticketId, TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE, ACTOR);
      const detail = await service.completeWorkflowStep(
        ticketId,
        TICKET_WORKFLOW_STEPS.DEPART,
        ACTOR,
      );

      expect(detail.status).toBe(TICKET_STATUSES.ON_ROUTE);
    });

    it('confirmar la asistencia no mueve el estado del servicio', async () => {
      // El paso del flujo y el estado del ticket son conceptos distintos: hay más
      // pasos que estados porque no todos cambian la situación del servicio.
      const ticketId = await ticketInStatus(TICKET_STATUSES.ASSIGNED);
      const before = (await service.findDetail(ticketId)).status;

      const detail = await service.completeWorkflowStep(
        ticketId,
        TICKET_WORKFLOW_STEPS.CONFIRM_ATTENDANCE,
        ACTOR,
      );

      expect(detail.status).toBe(before);
    });

    it('con la intervención cerrada no se admite ningún paso más', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.CANCELLED);

      await expect(
        service.completeWorkflowStep(ticketId, TICKET_WORKFLOW_STEPS.CLOSE, ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('un solo origen para la lista y el detalle', () => {
    it('lo que cambia en el detalle se ve en la lista', async () => {
      const ticketId = await ticketInStatus(TICKET_STATUSES.NEW);

      await service.changePriority(ticketId, { priority: TICKET_PRIORITIES.CRITICAL }, ACTOR);
      const { items } = await service.list(dataQuerySchema.parse({ pageSize: 100 }));

      expect(items.find((ticket) => ticket.id === ticketId)?.priority).toBe(
        TICKET_PRIORITIES.CRITICAL,
      );
    });

    it('la lista no arrastra lo que ninguna tabla muestra', async () => {
      const { items } = await service.list(dataQuerySchema.parse({}));
      const [first] = items;

      expect(first).toBeDefined();
      expect(first).not.toHaveProperty('address');
      expect(first).not.toHaveProperty('description');
      expect(first).not.toHaveProperty('completedSteps');
    });
  });
});
