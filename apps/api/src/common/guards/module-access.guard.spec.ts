import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { APP_MODULES, type AppModule } from '@redsis/contracts';
import type { RequestUser } from '../types/request-user';
import { ModuleAccessGuard } from './module-access.guard';

/**
 * Contexto mínimo: el guard solo necesita el usuario de la petición y los
 * metadatos del handler.
 */
function buildContext(user?: RequestUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => () => undefined,
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

function buildUser(modules: AppModule[]): RequestUser {
  return {
    id: 'user-1',
    email: 'persona@redsis.com',
    roles: ['coordinador'],
    modules,
    permissions: [],
  };
}

function buildGuard(required: AppModule | undefined): ModuleAccessGuard {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);

  return new ModuleAccessGuard(reflector);
}

describe('ModuleAccessGuard', () => {
  it('deja pasar un endpoint que no declara módulo', () => {
    const guard = buildGuard(undefined);

    expect(guard.canActivate(buildContext(buildUser([])))).toBe(true);
  });

  it('deja pasar a quien tiene acceso al módulo', () => {
    const guard = buildGuard(APP_MODULES.SECURITY);

    expect(guard.canActivate(buildContext(buildUser([APP_MODULES.SECURITY])))).toBe(true);
  });

  it('rechaza a quien no tiene acceso al módulo', () => {
    // Es lo que convierte el ocultar el menú en una restricción real: escribir la
    // URL a mano no sirve de nada.
    const guard = buildGuard(APP_MODULES.SECURITY);

    expect(() => guard.canActivate(buildContext(buildUser([APP_MODULES.TICKETS])))).toThrow(
      ForbiddenException,
    );
  });

  it('nombra el módulo en el error, con su etiqueta legible', () => {
    const guard = buildGuard(APP_MODULES.SECURITY);

    expect(() => guard.canActivate(buildContext(buildUser([])))).toThrow(/Seguridad/);
  });

  it('rechaza una petición sin usuario autenticado', () => {
    const guard = buildGuard(APP_MODULES.SECURITY);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });
});
