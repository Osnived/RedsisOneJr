import { Module } from '@nestjs/common';
import { ConnectionTesterRegistry, MockConnectionTester } from './connection-tester';
import { DataSourceRepository } from './data-source.repository';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { PrismaDataSourceProvider } from './providers/prisma-data-source.provider';

/**
 * Módulo de fuentes de datos.
 *
 * Aquí sí hay una sola línea de resolución: las fuentes son configuración de la
 * plataforma y viven siempre en su PostgreSQL. Lo que varía es el origen de los
 * **tickets**, no el de la lista de conexiones.
 *
 * Se exporta el servicio para que el módulo de Tickets pueda leer la fuente activa
 * cuando deje de decidirlo la variable de entorno. Un módulo nunca accede a los
 * datos de otro directamente (ver docs/ARCHITECTURE.md).
 */
@Module({
  controllers: [DataSourcesController],
  providers: [
    DataSourcesService,
    ConnectionTesterRegistry,
    MockConnectionTester,
    { provide: DataSourceRepository, useClass: PrismaDataSourceProvider },
  ],
  exports: [DataSourcesService],
})
export class DataSourcesModule {}
