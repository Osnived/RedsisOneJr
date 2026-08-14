import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { DATA_SOURCE_PROVIDERS } from '@redsis/contracts';
import { ConnectionTesterRegistry, MockConnectionTester } from './connection-tester';
import { decryptCredentials } from './credentials-cipher';
import { DataSourceRepository } from './data-source.repository';
import { DataSourcesService } from './data-sources.service';
import type { DataSourceRecord } from './data-source.types';

const KEY = randomBytes(32).toString('base64url');

function recordOf(overrides: Partial<DataSourceRecord> = {}): DataSourceRecord {
  return {
    id: '3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30',
    name: 'Tickets Retail',
    description: null,
    provider: DATA_SOURCE_PROVIDERS.MOCK,
    settings: {},
    encryptedCredentials: null,
    isActive: true,
    isDefault: false,
    lastCheckedAt: null,
    lastCheckOk: null,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

describe('DataSourcesService', () => {
  let module: TestingModule;
  let service: DataSourcesService;
  let repository: jest.Mocked<DataSourceRepository>;

  afterEach(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DataSourcesService,
        ConnectionTesterRegistry,
        MockConnectionTester,
        {
          provide: DataSourceRepository,
          useValue: {
            list: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn().mockResolvedValue(null),
            findDefault: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            setDefault: jest.fn(),
            recordCheck: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: { get: () => KEY } },
      ],
    }).compile();

    service = module.get(DataSourcesService);
    repository = module.get(DataSourceRepository);
  });

  describe('las credenciales nunca salen del backend', () => {
    it('la respuesta dice si las hay, nunca cuáles', async () => {
      repository.list.mockResolvedValue([
        recordOf({ encryptedCredentials: 'v1.aaa.bbb.ccc' }),
        recordOf({ id: 'otra', name: 'Sin token' }),
      ]);

      const [withToken, withoutToken] = await service.list();

      expect(withToken?.hasCredentials).toBe(true);
      expect(withoutToken?.hasCredentials).toBe(false);
      expect(withToken).not.toHaveProperty('credentials');
      expect(withToken).not.toHaveProperty('encryptedCredentials');
    });

    it('lo que se guarda está cifrado y se puede recuperar con la clave', async () => {
      repository.create.mockImplementation((data) => Promise.resolve(recordOf(data)));

      await service.create({
        name: 'RedsisOne Retail',
        provider: DATA_SOURCE_PROVIDERS.MOCK,
        settings: {},
        credentials: { apiToken: 'rsk_secreto' },
        isActive: true,
      });

      const saved = repository.create.mock.calls[0]?.[0].encryptedCredentials;

      expect(saved).not.toBeNull();
      expect(saved).not.toContain('rsk_secreto');
      expect(decryptCredentials(saved ?? '', Buffer.from(KEY, 'base64url'))).toEqual({
        apiToken: 'rsk_secreto',
      });
    });

    it('sin credenciales no se guarda ningún sobre', async () => {
      repository.create.mockImplementation((data) => Promise.resolve(recordOf(data)));

      await service.create({
        name: 'Simulado',
        provider: DATA_SOURCE_PROVIDERS.MOCK,
        settings: {},
        credentials: {},
        isActive: true,
      });

      expect(repository.create.mock.calls[0]?.[0].encryptedCredentials).toBeNull();
    });
  });

  describe('alta', () => {
    it('rechaza un nombre que ya existe', async () => {
      repository.findByName.mockResolvedValue(recordOf());

      await expect(
        service.create({
          name: 'Tickets Retail',
          provider: DATA_SOURCE_PROVIDERS.MOCK,
          settings: {},
          credentials: {},
          isActive: true,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('exige los parámetros que el proveedor declara obligatorios', async () => {
      // La lista sale del catálogo: añadir un parámetro a un proveedor no obliga a
      // tocar el servicio.
      await expect(
        service.create({
          name: 'RedsisOne sin configurar',
          provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
          settings: {},
          credentials: {},
          isActive: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('el error dice qué falta, por su nombre visible', async () => {
      await expect(
        service.create({
          name: 'RedsisOne a medias',
          provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
          settings: { baseUrl: 'https://one.redsis.app' },
          credentials: { apiToken: 'rsk_x' },
          isActive: true,
        }),
      ).rejects.toThrow(/Tablero/);
    });

    it('acepta una configuración completa', async () => {
      repository.create.mockImplementation((data) => Promise.resolve(recordOf(data)));

      await expect(
        service.create({
          name: 'RedsisOne Retail',
          provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
          settings: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
          credentials: { apiToken: 'rsk_x' },
          isActive: true,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('actualización', () => {
    it('omitir las credenciales conserva las guardadas', async () => {
      // Obligar a reescribir el token para cambiar el nombre llevaría a copiarlo y
      // pegarlo, que es como se filtran los secretos.
      const existing = recordOf({
        provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
        settings: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
        encryptedCredentials: 'v1.aaa.bbb.ccc',
      });

      repository.findById.mockResolvedValue(existing);
      repository.update.mockResolvedValue(existing);

      await service.update(existing.id, { name: 'Otro nombre' });

      expect(repository.update.mock.calls[0]?.[1]).not.toHaveProperty('encryptedCredentials');
    });

    it('un secreto ya guardado cuenta como presente al validar', async () => {
      const existing = recordOf({
        provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
        settings: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
        encryptedCredentials: 'v1.aaa.bbb.ccc',
      });

      repository.findById.mockResolvedValue(existing);
      repository.update.mockResolvedValue(existing);

      await expect(service.update(existing.id, { name: 'Otro nombre' })).resolves.toBeDefined();
    });

    it('una fuente que no existe no se puede actualizar', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('no-existe', { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('fuente por defecto', () => {
    it('no se puede retirar mientras lo sea', async () => {
      // Dejaría la pantalla de Tickets sin saber a quién preguntar.
      repository.findById.mockResolvedValue(recordOf({ isDefault: true }));

      await expect(service.remove('3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('una fuente desactivada no puede ser la de por defecto', async () => {
      repository.findById.mockResolvedValue(recordOf({ isActive: false }));

      await expect(
        service.setDefault('3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('un proveedor declarado y sin implementar tampoco', async () => {
      repository.findById.mockResolvedValue(recordOf({ provider: DATA_SOURCE_PROVIDERS.BASEROW }));

      await expect(service.setDefault('3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30')).rejects.toThrow(
        /Baserow/,
      );
    });

    it('el proveedor implementado sí se puede designar', async () => {
      repository.findById.mockResolvedValue(recordOf());
      repository.setDefault.mockResolvedValue(recordOf({ isDefault: true }));

      const result = await service.setDefault('3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30');

      expect(result.isDefault).toBe(true);
    });
  });

  describe('prueba de conexión', () => {
    it('se puede comprobar una configuración todavía sin guardar', async () => {
      const result = await service.testConnection({
        provider: DATA_SOURCE_PROVIDERS.MOCK,
        settings: {},
        credentials: {},
      });

      expect(result.ok).toBe(true);
      expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(repository.recordCheck).not.toHaveBeenCalled();
    });

    it('probar una fuente guardada anota el resultado', async () => {
      repository.findById.mockResolvedValue(recordOf());

      await service.testConnection({
        provider: DATA_SOURCE_PROVIDERS.MOCK,
        settings: {},
        credentials: {},
        dataSourceId: '3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30',
      });

      expect(repository.recordCheck).toHaveBeenCalledWith(
        '3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30',
        true,
        expect.any(Date),
      );
    });

    it('un proveedor sin implementar lo dice en lugar de dar la conexión por buena', async () => {
      const result = await service.testConnection({
        provider: DATA_SOURCE_PROVIDERS.SERVICENOW,
        settings: {},
        credentials: {},
      });

      expect(result.ok).toBe(false);
      expect(result.message).toContain('ServiceNow');
    });
  });
});
