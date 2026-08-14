import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { APP_MODULES, PERMISSIONS, type JwtPayload } from '@redsis/contracts';
import { TokenService } from './token.service';
import type { Env } from '../../config/env.schema';

const ENV: Partial<Env> = {
  JWT_SECRET: 'a'.repeat(40),
  JWT_EXPIRES_IN: '15m',
  REFRESH_TOKEN_SECRET: 'b'.repeat(40),
  REFRESH_TOKEN_EXPIRES_IN: '30d',
};

function buildPayload(): JwtPayload {
  return {
    sub: 'user-1',
    email: 'admin@redsis.com',
    roles: ['administrador'],
    // El token transporta los módulos desde el Release 0.6: sin ellos la
    // aplicación responde 403 en todas las pantallas.
    modules: [APP_MODULES.USERS],
    permissions: [PERMISSIONS.USERS_VIEW],
  };
}

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({});
    const configService = {
      get: (key: keyof Env) => ENV[key],
    } as unknown as ConfigService<Env, true>;

    service = new TokenService(jwtService, configService);
  });

  describe('issue', () => {
    it('emite un par de tokens distintos', async () => {
      const tokens = await service.issue(buildPayload());

      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
      expect(tokens.expiresIn).toBe(15 * 60);
    });

    it('incluye los permisos en el access token para que el guard no consulte la base', async () => {
      const tokens = await service.issue(buildPayload());

      const decoded = jwtService.decode<JwtPayload>(tokens.accessToken);
      expect(decoded.permissions).toEqual([PERMISSIONS.USERS_VIEW]);
      expect(decoded.sub).toBe('user-1');
    });

    it('no incluye los permisos en el refresh token', async () => {
      const tokens = await service.issue(buildPayload());

      const decoded = jwtService.decode<Record<string, unknown>>(tokens.refreshToken);
      expect(decoded['permissions']).toBeUndefined();
      expect(decoded['jti']).toBeDefined();
    });

    it('genera un identificador distinto en cada emisión', async () => {
      const first = await service.issue(buildPayload());
      const second = await service.issue(buildPayload());

      expect(first.refreshToken).not.toBe(second.refreshToken);
    });
  });

  describe('verifyRefreshToken', () => {
    it('acepta un refresh token emitido por el propio servicio', async () => {
      const tokens = await service.issue(buildPayload());

      const payload = await service.verifyRefreshToken(tokens.refreshToken);

      expect(payload.sub).toBe('user-1');
    });

    it('rechaza el access token como refresh token', async () => {
      const tokens = await service.issue(buildPayload());

      await expect(service.verifyRefreshToken(tokens.accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza un token manipulado', async () => {
      await expect(service.verifyRefreshToken('no-es-un-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('hashRefreshToken', () => {
    it('produce siempre el mismo hash para el mismo token', () => {
      expect(service.hashRefreshToken('token')).toBe(service.hashRefreshToken('token'));
    });

    it('produce hashes distintos para tokens distintos', () => {
      expect(service.hashRefreshToken('token-a')).not.toBe(service.hashRefreshToken('token-b'));
    });

    it('no permite recuperar el token original', () => {
      const hash = service.hashRefreshToken('token-secreto');

      expect(hash).not.toContain('token-secreto');
      expect(hash).toHaveLength(64);
    });
  });

  describe('refreshTokenExpiration', () => {
    it('devuelve la expiración declarada en el token', async () => {
      const tokens = await service.issue(buildPayload());

      const expiration = service.refreshTokenExpiration(tokens.refreshToken);

      const daysAhead = (expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(Math.round(daysAhead)).toBe(30);
    });

    it('falla si el token no declara expiración', () => {
      const tokenWithoutExpiration = jwtService.sign({ sub: 'user-1' }, { secret: 'x'.repeat(40) });

      // `sign` sin expiresIn no incluye exp
      expect(() => service.refreshTokenExpiration(tokenWithoutExpiration)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
