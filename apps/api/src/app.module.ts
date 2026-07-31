import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module';
import type { Env } from './config/env.schema';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ModuleAccessGuard } from './common/guards/module-access.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { SecurityModule } from './modules/security/security.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: configService.get('LOG_LEVEL', { infer: true }),
          // En desarrollo se prioriza la legibilidad; en producción, JSON estructurado.
          transport:
            configService.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } }
              : undefined,
          // Nunca registrar credenciales ni tokens.
          redact: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.refreshToken',
          ],
        },
      }),
    }),
    PrismaModule,

    // Módulos funcionales. Cada uno es independiente y reutiliza la infraestructura común.
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SecurityModule,
    ActivityLogModule,
  ],
  providers: [
    // La autenticación está activa por defecto: un endpoint solo queda público
    // si se marca explícitamente con @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // El orden importa: primero se comprueba el acceso al módulo y solo después
    // los permisos. Son dos puertas, y la de fuera se abre primero.
    { provide: APP_GUARD, useClass: ModuleAccessGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
