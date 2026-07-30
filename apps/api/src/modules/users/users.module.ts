import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { PasswordModule } from '../auth/password.module';
import { PrismaUserProvider } from './providers/prisma-user.provider';
import { UserRepository } from './user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PasswordModule, ActivityLogModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    // El contrato se resuelve con el Provider de PostgreSQL.
    // Cambiar de origen de datos es cambiar esta línea.
    { provide: UserRepository, useClass: PrismaUserProvider },
  ],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
