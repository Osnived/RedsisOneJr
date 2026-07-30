import { Module } from '@nestjs/common';
import { PermissionRepository } from './permission.repository';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PrismaPermissionProvider } from './providers/prisma-permission.provider';

@Module({
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    { provide: PermissionRepository, useClass: PrismaPermissionProvider },
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
