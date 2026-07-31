import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaSecurityProvider } from './providers/prisma-security.provider';
import { SecurityController } from './security.controller';
import { SecurityRepository } from './security.repository';
import { SecurityService } from './security.service';

/**
 * Módulo Seguridad: única fuente de verdad de la administración de accesos.
 *
 * Reutiliza el catálogo de permisos del módulo Permisos en lugar de consultarlo
 * por su cuenta, y el historial de actividad para el rastro transversal.
 */
@Module({
  imports: [ActivityLogModule, PermissionsModule],
  controllers: [SecurityController],
  providers: [SecurityService, { provide: SecurityRepository, useClass: PrismaSecurityProvider }],
  exports: [SecurityService],
})
export class SecurityModule {}
