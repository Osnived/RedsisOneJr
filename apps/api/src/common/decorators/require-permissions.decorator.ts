import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@redsis/contracts';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declara los permisos necesarios para acceder a un endpoint.
 *
 * La autorización se basa en permisos, nunca únicamente en roles
 * (ver PROJECT_CONTEXT.md). El usuario debe poseer todos los permisos listados.
 */
export const RequirePermissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator => SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
