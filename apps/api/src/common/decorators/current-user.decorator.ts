import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../types/request-user';

/**
 * Extrae el usuario autenticado que la estrategia JWT dejó en la petición.
 * Evita repetir `request.user` con casts en cada controlador.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();

    if (!request.user) {
      throw new Error('CurrentUser se usó en una ruta sin autenticación');
    }

    return request.user;
  },
);
