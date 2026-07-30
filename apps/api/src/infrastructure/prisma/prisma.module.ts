import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Se declara global porque todos los Providers de PostgreSQL lo necesitan
 * y duplicar la importación en cada módulo no aporta nada.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
