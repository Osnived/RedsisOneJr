import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALL_APP_MODULES, PERMISSIONS, type Permission } from '@redsis/contracts';
import { PermissionsGuard } from './permissions.guard';
import type { RequestUser } from '../types/request-user';

function buildContext(user?: RequestUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

function buildUser(permissions: Permission[]): RequestUser {
  return {
    id: 'user-1',
    email: 'admin@redsis.com',
    roles: ['administrador'],
    modules: [...ALL_APP_MODULES],
    permissions,
  };
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function requirePermissions(permissions: Permission[] | undefined): void {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);
  }

  it('permite el acceso cuando el endpoint no declara permisos', () => {
    requirePermissions(undefined);

    expect(guard.canActivate(buildContext(buildUser([])))).toBe(true);
  });

  it('permite el acceso cuando la lista de permisos está vacía', () => {
    requirePermissions([]);

    expect(guard.canActivate(buildContext(buildUser([])))).toBe(true);
  });

  it('permite el acceso cuando el usuario posee el permiso exigido', () => {
    requirePermissions([PERMISSIONS.USERS_VIEW]);

    expect(guard.canActivate(buildContext(buildUser([PERMISSIONS.USERS_VIEW])))).toBe(true);
  });

  it('exige todos los permisos declarados, no solo uno', () => {
    requirePermissions([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT]);

    expect(() => guard.canActivate(buildContext(buildUser([PERMISSIONS.USERS_VIEW])))).toThrow(
      ForbiddenException,
    );
  });

  it('indica en el mensaje qué permiso falta', () => {
    requirePermissions([PERMISSIONS.USERS_DELETE]);

    expect(() => guard.canActivate(buildContext(buildUser([PERMISSIONS.USERS_VIEW])))).toThrow(
      /users\.delete/,
    );
  });

  it('rechaza la petición cuando no hay usuario autenticado', () => {
    requirePermissions([PERMISSIONS.USERS_VIEW]);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });

  it('no concede acceso por tener otros permisos del mismo módulo', () => {
    requirePermissions([PERMISSIONS.USERS_CREATE]);

    expect(() =>
      guard.canActivate(buildContext(buildUser([PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT]))),
    ).toThrow(ForbiddenException);
  });
});
