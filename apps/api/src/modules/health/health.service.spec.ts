import { Test, type TestingModule } from '@nestjs/testing';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let module: TestingModule;
  let service: HealthService;
  let health: jest.Mocked<HealthRepository>;

  afterEach(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: HealthRepository, useValue: { isReachable: jest.fn() } },
      ],
    }).compile();

    service = module.get(HealthService);
    health = module.get(HealthRepository);
  });

  it('informa ok cuando el origen de datos responde', async () => {
    health.isReachable.mockResolvedValue(true);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
  });

  it('informa degradado cuando el origen no responde', async () => {
    health.isReachable.mockResolvedValue(false);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('down');
  });

  it('incluye la marca de tiempo en formato ISO', async () => {
    health.isReachable.mockResolvedValue(true);

    const result = await service.check();

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('se puede comprobar sin una base de datos, gracias al Repository', async () => {
    // Esta prueba es la razón de la refactorización: antes el controlador
    // inyectaba Prisma y no había forma de ejercitarlo sin PostgreSQL.
    health.isReachable.mockResolvedValue(false);

    await expect(service.check()).resolves.toBeDefined();
    expect(health.isReachable).toHaveBeenCalledTimes(1);
  });
});
