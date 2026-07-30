import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordModule } from './password.module';
import { PrismaSessionProvider } from './providers/prisma-session.provider';
import { SessionRepository } from './session.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    PassportModule,
    // Los secretos se pasan por operación en TokenService, porque access y
    // refresh usan claves distintas.
    JwtModule.register({}),
    UsersModule,
    PasswordModule,
    ActivityLogModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    { provide: SessionRepository, useClass: PrismaSessionProvider },
  ],
  exports: [AuthService],
})
export class AuthModule {}
