import { SetMetadata } from '@nestjs/common';
import type { AppModule } from '@redsis/contracts';

export const REQUIRED_MODULE_KEY = 'requiredModule';

/**
 * Declara el módulo al que hay que tener acceso para usar un endpoint.
 *
 * Es la primera de las dos puertas de la autorización: sin acceso al módulo no
 * se evalúan sus permisos. Se aplica sobre la clase del controlador, porque un
 * módulo se concede o se niega completo.
 */
export const RequireModule = (module: AppModule): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_MODULE_KEY, module);
