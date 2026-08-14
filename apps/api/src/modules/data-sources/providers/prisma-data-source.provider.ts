import { Injectable } from '@nestjs/common';
import { isDataSourceProvider, type DataSourceProvider } from '@redsis/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DataSourceRepository } from '../data-source.repository';
import type {
  CreateDataSourceData,
  DataSourceRecord,
  UpdateDataSourceData,
} from '../data-source.types';

/** Fila de `data_sources` tal como la devuelve Prisma. No sale de este archivo. */
interface DataSourceRow {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  settings: unknown;
  credentials: string | null;
  isActive: boolean;
  isDefault: boolean;
  lastCheckedAt: Date | null;
  lastCheckOk: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fuentes de datos sobre la PostgreSQL de la plataforma.
 *
 * Es el único archivo del módulo que conoce Prisma. Traduce filas a tipos de
 * dominio y nunca deja escapar un modelo del ORM.
 */
@Injectable()
export class PrismaDataSourceProvider extends DataSourceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<DataSourceRecord[]> {
    const rows = await this.prisma.dataSource.findMany({ orderBy: { name: 'asc' } });

    return rows.map(toRecord);
  }

  async findById(id: string): Promise<DataSourceRecord | null> {
    const row = await this.prisma.dataSource.findUnique({ where: { id } });

    return row === null ? null : toRecord(row);
  }

  async findByName(name: string): Promise<DataSourceRecord | null> {
    const row = await this.prisma.dataSource.findUnique({ where: { name } });

    return row === null ? null : toRecord(row);
  }

  async findDefault(): Promise<DataSourceRecord | null> {
    const row = await this.prisma.dataSource.findFirst({
      where: { isDefault: true, isActive: true },
    });

    return row === null ? null : toRecord(row);
  }

  async create(data: CreateDataSourceData): Promise<DataSourceRecord> {
    const row = await this.prisma.dataSource.create({
      data: {
        name: data.name,
        description: data.description,
        provider: data.provider,
        settings: data.settings,
        credentials: data.encryptedCredentials,
        isActive: data.isActive,
      },
    });

    return toRecord(row);
  }

  async update(id: string, data: UpdateDataSourceData): Promise<DataSourceRecord> {
    const row = await this.prisma.dataSource.update({
      where: { id },
      // Se construye el objeto en lugar de extenderlo para que omitir un campo
      // signifique conservarlo. Extenderlo con `undefined` haría lo mismo, pero
      // haría falta leerlo dos veces para saberlo.
      data: {
        ...(data.name === undefined ? {} : { name: data.name }),
        ...(data.description === undefined ? {} : { description: data.description }),
        ...(data.settings === undefined ? {} : { settings: data.settings }),
        ...(data.encryptedCredentials === undefined
          ? {}
          : { credentials: data.encryptedCredentials }),
        ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
      },
    });

    return toRecord(row);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.dataSource.delete({ where: { id } });
  }

  async setDefault(id: string): Promise<DataSourceRecord> {
    // En transacción: entre retirar la marca anterior y poner la nueva no puede
    // existir un instante sin fuente por defecto ni con dos.
    const [, row] = await this.prisma.$transaction([
      this.prisma.dataSource.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      }),
      this.prisma.dataSource.update({ where: { id }, data: { isDefault: true } }),
    ]);

    return toRecord(row);
  }

  async recordCheck(id: string, ok: boolean, checkedAt: Date): Promise<void> {
    await this.prisma.dataSource.update({
      where: { id },
      data: { lastCheckOk: ok, lastCheckedAt: checkedAt },
    });
  }
}

function toRecord(row: DataSourceRow): DataSourceRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    provider: toProvider(row.provider),
    settings: toSettings(row.settings),
    encryptedCredentials: row.credentials,
    isActive: row.isActive,
    isDefault: row.isDefault,
    lastCheckedAt: row.lastCheckedAt,
    lastCheckOk: row.lastCheckOk,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * El proveedor se guarda como texto, así que al leerlo hay que comprobarlo.
 *
 * Una fila con un proveedor que ya no existe en el catálogo —retirado en una
 * versión posterior— se delata al leerla en lugar de propagarse como un valor que
 * el resto del código cree válido.
 */
function toProvider(value: string): DataSourceProvider {
  if (!isDataSourceProvider(value)) {
    throw new Error(`La fuente de datos declara un proveedor desconocido: ${value}`);
  }

  return value;
}

/** Los parámetros se guardan como JSON; se descartan los valores que no sean texto. */
function toSettings(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const settings: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      settings[key] = entry;
    }
  }

  return settings;
}
