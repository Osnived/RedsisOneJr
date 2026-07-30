import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PERMISSIONS } from '@redsis/contracts';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PasswordService } from '../auth/password.service';
import { UserRepository } from './user.repository';
import { UsersService } from './users.service';
import type { UserWithAccess } from './user.types';

function buildUser(overrides: Partial<UserWithAccess> = {}): UserWithAccess {
  return {
    id: 'user-1',
    email: 'admin@redsis.com',
    fullName: 'Administrador',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    roles: ['administrador'],
    permissions: [PERMISSIONS.USERS_VIEW],
    ...overrides,
  };
}

describe('UsersService', () => {
  let module: TestingModule;
  let service: UsersService;
  let users: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let activityLog: jest.Mocked<ActivityLogService>;

  afterEach(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            list: jest.fn(),
            findById: jest.fn(),
            existsByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
          },
        },
        { provide: PasswordService, useValue: { hash: jest.fn().mockResolvedValue('hashed') } },
        {
          provide: ActivityLogService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    users = module.get(UserRepository);
    passwordService = module.get(PasswordService);
    activityLog = module.get(ActivityLogService);
  });

  describe('list', () => {
    it('traduce la página solicitada al desplazamiento del repositorio', async () => {
      users.list.mockResolvedValue({ items: [], total: 0 });

      await service.list({ page: 3, pageSize: 10 });

      expect(users.list).toHaveBeenCalledWith({ skip: 20, take: 10 });
    });

    it('calcula el total de páginas', async () => {
      users.list.mockResolvedValue({ items: [buildUser()], total: 42 });

      const result = await service.list({ page: 1, pageSize: 10 });

      expect(result.totalPages).toBe(5);
      expect(result.total).toBe(42);
    });

    it('serializa las fechas en formato ISO', async () => {
      users.list.mockResolvedValue({
        items: [buildUser({ lastLoginAt: new Date('2026-05-05T10:00:00.000Z') })],
        total: 1,
      });

      const result = await service.list({ page: 1, pageSize: 10 });

      expect(result.items[0]?.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result.items[0]?.lastLoginAt).toBe('2026-05-05T10:00:00.000Z');
    });
  });

  describe('findById', () => {
    it('falla cuando el usuario no existe', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const input = {
      email: 'nuevo@redsis.com',
      fullName: 'Nuevo Usuario',
      password: 'Redsis2026',
      roleIds: ['role-1'],
    };

    it('rechaza un correo ya registrado', async () => {
      users.existsByEmail.mockResolvedValue(true);

      await expect(service.create(input, { actorId: 'user-1' })).rejects.toThrow(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('guarda la contraseña hasheada, nunca en texto plano', async () => {
      users.existsByEmail.mockResolvedValue(false);
      users.create.mockResolvedValue(buildUser({ id: 'user-2', email: input.email }));

      await service.create(input, { actorId: 'user-1' });

      expect(passwordService.hash).toHaveBeenCalledWith('Redsis2026');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed', email: 'nuevo@redsis.com' }),
      );
      const [payload] = users.create.mock.calls[0] ?? [];
      expect(JSON.stringify(payload)).not.toContain('Redsis2026');
    });

    it('registra la creación en el historial de actividad', async () => {
      users.existsByEmail.mockResolvedValue(false);
      users.create.mockResolvedValue(buildUser({ id: 'user-2', email: input.email }));

      await service.create(input, { actorId: 'user-1', ipAddress: '10.0.0.1' });

      expect(activityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', module: 'users', entityId: 'user-2' }),
      );
    });
  });

  describe('update', () => {
    it('registra qué campos cambiaron', async () => {
      users.update.mockResolvedValue(buildUser({ fullName: 'Nombre Nuevo' }));

      await service.update('user-1', { fullName: 'Nombre Nuevo' }, { actorId: 'user-2' });

      expect(activityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', metadata: { changes: ['fullName'] } }),
      );
    });
  });

  describe('deactivate', () => {
    it('impide que un usuario desactive su propia cuenta', async () => {
      await expect(service.deactivate('user-1', { actorId: 'user-1' })).rejects.toThrow(
        /su propia cuenta/,
      );
      expect(users.deactivate).not.toHaveBeenCalled();
    });

    it('desactiva a otro usuario y lo registra', async () => {
      users.deactivate.mockResolvedValue(buildUser({ id: 'user-2', isActive: false }));

      const result = await service.deactivate('user-2', { actorId: 'user-1' });

      expect(result).toEqual({ id: 'user-2', isActive: false });
      expect(activityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', entityId: 'user-2' }),
      );
    });
  });
});
