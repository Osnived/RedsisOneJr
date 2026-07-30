import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { assertProductionSafety, validateEnv } from './env.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: (raw: Record<string, unknown>) => {
        const env = validateEnv(raw);
        assertProductionSafety(env);
        return env;
      },
    }),
  ],
})
export class AppConfigModule {}
