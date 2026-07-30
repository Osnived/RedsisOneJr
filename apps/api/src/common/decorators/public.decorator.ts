import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como accesible sin autenticación.
 *
 * La autenticación está activada globalmente: un endpoint solo queda expuesto
 * si se declara explícitamente, nunca por olvido.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
