import { CanActivate, ForbiddenException, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Permission } from '@redsis/contracts';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { RequestUser } from '../types/request-user';

/**
 * Verifica que el usuario autenticado posea los permisos declarados
 * con `@RequirePermissions(...)`.
 *
 * Se exigen todos los permisos listados, no solo uno: un endpoint que
 * combina lectura y escritura debe requerir ambos de forma explícita.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No hay usuario autenticado en la petición');
    }

    const granted = new Set<string>(user.permissions);
    const missing = required.filter((permission) => !granted.has(permission));

    if (missing.length > 0) {
      throw new ForbiddenException(`Permisos insuficientes: faltan ${missing.join(', ')}`);
    }

    return true;
  }
}
