import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ALL_APP_MODULES, PERMISSIONS, type AuthTokens } from '@redsis/contracts';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UserRepository } from '../users/user.repository';
import type { UserWithAccess, UserWithCredentials } from '../users/user.types';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionRepository } from './session.repository';
import { TokenService } from './token.service';
import type { SessionRecord } from './session.types';

const PASSWORD_HASH = '$2b$12$hash';

function buildUser(overrides: Partial<UserWithCredentials> = {}): UserWithCredentials {
  return {
    id: 'user-1',
    email: 'admin@redsis.com',
    fullName: 'Administrador',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    passwordHash: PASSWORD_HASH,
    roles: ['administrador'],
    roleIds: ['role-1'],
    modules: [...ALL_APP_MODULES],
    permissions: [PERMISSIONS.USERS_VIEW],
    ...overrides,
  };
}

function buildTokens(): AuthTokens {
  return { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 900 };
}

function buildSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-1',
    userId: 'user-1',
    expiresAt: new Date('2026-12-31T00:00:00.000Z'),
    revokedAt: null,
    ...overrides,
  };
}

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;
  let users: jest.Mocked<UserRepository>;
  let sessions: jest.Mocked<SessionRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let activityLog: jest.Mocked<ActivityLogService>;

  afterEach(async () => {
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            registerLogin: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(buildSession()),
            findActiveByTokenHash: jest.fn(),
            revokeById: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: PasswordService, useValue: { compare: jest.fn(), hash: jest.fn() } },
        {
          provide: TokenService,
          useValue: {
            issue: jest.fn().mockResolvedValue(buildTokens()),
            verifyRefreshToken: jest.fn(),
            hashRefreshToken: jest.fn().mockReturnValue('token-hash'),
            refreshTokenExpiration: jest.fn().mockReturnValue(new Date('2026-12-31T00:00:00.000Z')),
          },
        },
        {
          provide: ActivityLogService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    users = module.get(UserRepository);
    sessions = module.get(SessionRepository);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    activityLog = module.get(ActivityLogService);
  });

  describe('login', () => {
    it('devuelve el usuario y los tokens cuando las credenciales son correctas', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(true);

      const result = await service.login('admin@redsis.com', 'Redsis2026');

      expect(result.user).toEqual({
        id: 'user-1',
        email: 'admin@redsis.com',
        fullName: 'Administrador',
        isActive: true,
        roles: ['administrador'],
        modules: [...ALL_APP_MODULES],
        permissions: [PERMISSIONS.USERS_VIEW],
      });
      expect(result.tokens).toEqual(buildTokens());
    });

    it('nunca expone el hash de la contraseña en la respuesta', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(true);

      const result = await service.login('admin@redsis.com', 'Redsis2026');

      expect(JSON.stringify(result)).not.toContain(PASSWORD_HASH);
    });

    it('registra la sesión con el hash del refresh token, no con el token', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(true);

      await service.login('admin@redsis.com', 'Redsis2026', { ipAddress: '10.0.0.1' });

      expect(sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', refreshTokenHash: 'token-hash' }),
      );
      const [payload] = sessions.create.mock.calls[0] ?? [];
      expect(JSON.stringify(payload)).not.toContain('refresh-token');
    });

    it('deja registro de actividad y actualiza el último acceso', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(true);

      await service.login('admin@redsis.com', 'Redsis2026', { ipAddress: '10.0.0.1' });

      expect(users.registerLogin).toHaveBeenCalledWith('user-1', expect.any(Date));
      expect(activityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', action: 'login', ipAddress: '10.0.0.1' }),
      );
    });

    it('rechaza una contraseña incorrecta', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(false);

      await expect(service.login('admin@redsis.com', 'incorrecta')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('usa el mismo mensaje para usuario inexistente que para contraseña incorrecta', async () => {
      users.findByEmail.mockResolvedValue(null);
      passwordService.compare.mockResolvedValue(false);

      await expect(service.login('desconocido@redsis.com', 'x')).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('compara contra un hash aunque el usuario no exista, para no delatar correos registrados', async () => {
      users.findByEmail.mockResolvedValue(null);
      passwordService.compare.mockResolvedValue(false);

      await expect(service.login('desconocido@redsis.com', 'x')).rejects.toThrow();

      expect(passwordService.compare).toHaveBeenCalledTimes(1);
    });

    it('rechaza una cuenta desactivada aunque la contraseña sea correcta', async () => {
      users.findByEmail.mockResolvedValue(buildUser({ isActive: false }));
      passwordService.compare.mockResolvedValue(true);

      await expect(service.login('admin@redsis.com', 'Redsis2026')).rejects.toThrow(
        'La cuenta está desactivada',
      );
    });
  });

  describe('refresh', () => {
    const activeUser: UserWithAccess = buildUser();

    it('revoca la sesión anterior antes de emitir la nueva', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ sub: 'user-1', jti: 'jti-1' });
      sessions.findActiveByTokenHash.mockResolvedValue(buildSession());
      users.findById.mockResolvedValue(activeUser);

      await service.refresh('refresh-token');

      expect(sessions.revokeById).toHaveBeenCalledWith('session-1', expect.any(Date));
      expect(sessions.create).toHaveBeenCalledTimes(1);
    });

    it('rechaza un refresh token cuya sesión ya no está vigente', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ sub: 'user-1', jti: 'jti-1' });
      sessions.findActiveByTokenHash.mockResolvedValue(null);

      await expect(service.refresh('refresh-token')).rejects.toThrow(
        'La sesión no existe o ya fue cerrada',
      );
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('rechaza un refresh token que apunta a otro usuario', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ sub: 'otro-usuario', jti: 'jti-1' });
      sessions.findActiveByTokenHash.mockResolvedValue(buildSession({ userId: 'user-1' }));

      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
      expect(sessions.revokeById).not.toHaveBeenCalled();
    });

    it('rechaza la renovación si la cuenta fue desactivada durante la sesión', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ sub: 'user-1', jti: 'jti-1' });
      sessions.findActiveByTokenHash.mockResolvedValue(buildSession());
      users.findById.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.refresh('refresh-token')).rejects.toThrow(
        'La cuenta ya no está habilitada',
      );
    });
  });

  describe('logout', () => {
    it('revoca la sesión y registra la salida', async () => {
      sessions.findActiveByTokenHash.mockResolvedValue(buildSession());

      await service.logout('refresh-token', 'user-1', '10.0.0.1');

      expect(sessions.revokeById).toHaveBeenCalledWith('session-1', expect.any(Date));
      expect(activityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'logout', userId: 'user-1' }),
      );
    });

    it('no falla si la sesión ya estaba cerrada', async () => {
      sessions.findActiveByTokenHash.mockResolvedValue(null);

      await expect(service.logout('refresh-token', 'user-1')).resolves.toBeUndefined();
      expect(sessions.revokeById).not.toHaveBeenCalled();
    });
  });

  describe('currentUser', () => {
    it('devuelve los permisos efectivos del usuario', async () => {
      users.findById.mockResolvedValue(buildUser());

      const result = await service.currentUser('user-1');

      expect(result.permissions).toEqual([PERMISSIONS.USERS_VIEW]);
    });

    it('rechaza a un usuario desactivado', async () => {
      users.findById.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.currentUser('user-1')).rejects.toThrow(UnauthorizedException);
    });
  });
});
