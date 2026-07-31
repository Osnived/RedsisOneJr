import { CanActivate, ForbiddenException, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { findAppModule, type AppModule } from '@redsis/contracts';
import { REQUIRED_MODULE_KEY } from '../decorators/require-module.decorator';
import type { RequestUser } from '../types/request-user';

/**
 * Verifica el acceso al módulo declarado con `@RequireModule(...)`.
 *
 * Se ejecuta antes de comprobar permisos porque son dos puertas distintas: un
 * rol sin acceso a Tickets no debe entrar aunque conserve `tickets.view` de una
 * configuración anterior. Sin esto, retirar el módulo en la interfaz solo
 * ocultaría el menú y la URL seguiría funcionando.
 */
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppModule | undefined>(REQUIRED_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No hay usuario autenticado en la petición');
    }

    if (!user.modules.includes(required)) {
      const label = findAppModule(required)?.label ?? required;

      throw new ForbiddenException(`No tienes acceso al módulo ${label}`);
    }

    return true;
  }
}
