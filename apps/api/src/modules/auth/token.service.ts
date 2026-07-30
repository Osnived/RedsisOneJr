import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import type { AuthTokens, JwtPayload } from '@redsis/contracts';
import type { Env } from '../../config/env.schema';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

/** Campos de tiempo que incluye todo token emitido, en segundos desde época. */
interface DecodedToken {
  exp?: number;
  iat?: number;
}

/**
 * Emisión y verificación de tokens.
 *
 * El access token es de vida corta y transporta los permisos para que el guard
 * no consulte la base de datos en cada petición. El refresh token es de vida
 * larga y solo se guarda su hash SHA-256: si alguien lee la tabla de sesiones,
 * no obtiene tokens utilizables. Se usa SHA-256 y no bcrypt porque el hash
 * debe poder buscarse de forma directa por índice.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async issue(payload: JwtPayload): Promise<AuthTokens> {
    const jti = randomUUID();

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', { infer: true }),
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, jti } satisfies RefreshTokenPayload,
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET', { infer: true }),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', { infer: true }),
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenLifetimeInSeconds(accessToken),
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('El refresh token no es válido o ha expirado');
    }
  }

  /** Hash determinista usado como clave de búsqueda de la sesión. */
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Fecha de expiración del refresh token, tomada del propio token. */
  refreshTokenExpiration(token: string): Date {
    const decoded = this.jwtService.decode<DecodedToken | null>(token);

    if (!decoded?.exp) {
      throw new UnauthorizedException('El refresh token no contiene expiración');
    }

    return new Date(decoded.exp * 1000);
  }

  private accessTokenLifetimeInSeconds(accessToken: string): number {
    const decoded = this.jwtService.decode<DecodedToken | null>(accessToken);

    if (!decoded?.exp || !decoded.iat) {
      return 0;
    }

    return decoded.exp - decoded.iat;
  }
}
