import { Module } from '@nestjs/common';
import { PrismaRoleProvider } from './providers/prisma-role.provider';
import { RoleRepository } from './role.repository';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, { provide: RoleRepository, useClass: PrismaRoleProvider }],
  exports: [RolesService],
})
export class RolesModule {}
