import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { isAppModule, isPermission, type JwtPayload } from '@redsis/contracts';
import type { Env } from '../../../config/env.schema';
import type { RequestUser } from '../../../common/types/request-user';

/**
 * Valida el access token y construye el usuario de la petición.
 *
 * Los permisos se leen del token, no de la base de datos: el access token dura
 * pocos minutos, así que un cambio de permisos se refleja en el siguiente
 * refresh sin necesidad de consultar PostgreSQL en cada petición.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    if (!payload.sub) {
      throw new UnauthorizedException('El token no identifica a ningún usuario');
    }

    // Se filtra contra los catálogos en lugar de afirmar el tipo: el token lo
    // firmamos nosotros, pero es una entrada del exterior y en una superficie de
    // autorización no se dan por buenos los valores sin comprobarlos.
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      modules: (payload.modules ?? []).filter(isAppModule),
      permissions: (payload.permissions ?? []).filter(isPermission),
    };
  }
}
