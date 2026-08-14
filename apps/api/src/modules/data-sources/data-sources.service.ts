import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DATA_SOURCE_FIELD_KINDS,
  findDataSourceProvider,
  type CreateDataSourceInput,
  type DataSourceConnectionTest,
  type DataSourceProvider,
  type DataSourceProviderDefinition,
  type DataSourceSummary,
  type TestDataSourceConnectionInput,
  type UpdateDataSourceInput,
} from '@redsis/contracts';
import type { Env } from '../../config/env.schema';
import { ConnectionTesterRegistry } from './connection-tester';
import { decryptCredentials, encryptCredentials, parseEncryptionKey } from './credentials-cipher';
import { DataSourceRepository } from './data-source.repository';
import type { DataSourceRecord } from './data-source.types';

/**
 * Administración de las fuentes de datos.
 *
 * Concentra las tres cosas que no pueden salir de aquí:
 *
 * 1. **Las credenciales nunca vuelven al frontend.** `toSummary` no las incluye, y
 *    es el único camino por el que una fuente sale del backend.
 * 2. **Se cifran antes de guardarse** y solo se descifran para hablar con el
 *    proveedor.
 * 3. **Una configuración incompleta se rechaza al guardar**, comparándola con lo
 *    que el catálogo dice que pide ese proveedor.
 */
@Injectable()
export class DataSourcesService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly repository: DataSourceRepository,
    private readonly testers: ConnectionTesterRegistry,
    configService: ConfigService<Env, true>,
  ) {
    // Se interpreta una sola vez y al construir el servicio: una clave mal escrita
    // debe impedir arrancar, no fallar al guardar la primera fuente.
    this.encryptionKey = parseEncryptionKey(
      configService.get('DATA_SOURCE_ENCRYPTION_KEY', { infer: true }),
    );
  }

  async list(): Promise<DataSourceSummary[]> {
    const records = await this.repository.list();

    return records.map((record) => toSummary(record));
  }

  async findById(id: string): Promise<DataSourceSummary> {
    return toSummary(await this.recordOrNotFound(id));
  }

  async create(input: CreateDataSourceInput): Promise<DataSourceSummary> {
    const definition = this.definitionOf(input.provider);

    await this.assertNameIsFree(input.name);
    this.assertConfigurationIsComplete(definition, input.settings, input.credentials);

    const record = await this.repository.create({
      name: input.name,
      description: input.description ?? null,
      provider: input.provider,
      settings: input.settings,
      encryptedCredentials: this.encryptIfAny(input.credentials),
      isActive: input.isActive,
    });

    return toSummary(record);
  }

  /**
   * Actualiza una fuente.
   *
   * Omitir las credenciales las conserva: obligar a reescribir el token para
   * cambiar el nombre de una fuente llevaría a copiarlo y pegarlo, que es como se
   * filtran los secretos.
   */
  async update(id: string, input: UpdateDataSourceInput): Promise<DataSourceSummary> {
    const existing = await this.recordOrNotFound(id);
    const definition = this.definitionOf(existing.provider);

    if (input.name !== undefined && input.name !== existing.name) {
      await this.assertNameIsFree(input.name);
    }

    const settings = input.settings ?? existing.settings;
    const credentials = input.credentials ?? {};

    this.assertConfigurationIsComplete(
      definition,
      settings,
      credentials,
      existing.encryptedCredentials !== null,
    );

    const record = await this.repository.update(id, {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.settings === undefined ? {} : { settings: input.settings }),
      ...(Object.keys(credentials).length === 0
        ? {}
        : { encryptedCredentials: encryptCredentials(credentials, this.encryptionKey) }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    });

    return toSummary(record);
  }

  /**
   * Retira una fuente.
   *
   * La de por defecto no se puede retirar mientras lo sea: dejaría la pantalla de
   * Tickets sin saber a quién preguntar. Primero se designa otra.
   */
  async remove(id: string): Promise<void> {
    const record = await this.recordOrNotFound(id);

    if (record.isDefault) {
      throw new ConflictException(
        'No se puede retirar la fuente por defecto. Designa otra antes de retirarla.',
      );
    }

    await this.repository.remove(id);
  }

  /**
   * Designa la fuente que se usa cuando no se pide un proyecto concreto.
   *
   * Exige que el proveedor esté implementado y la fuente activa: designar una que
   * no puede responder deja la pantalla de Tickets sin datos y sin explicación.
   */
  async setDefault(id: string): Promise<DataSourceSummary> {
    const record = await this.recordOrNotFound(id);

    if (!record.isActive) {
      throw new ConflictException('Una fuente desactivada no puede ser la de por defecto.');
    }

    if (!this.testers.isImplemented(record.provider)) {
      const definition = this.definitionOf(record.provider);

      throw new ConflictException(
        `${definition.label} está declarado y todavía no se puede usar como origen.`,
      );
    }

    return toSummary(await this.repository.setDefault(id));
  }

  /**
   * Comprueba una configuración contra el proveedor.
   *
   * Admite dos formas: una configuración todavía sin guardar —el caso útil, porque
   * el momento de probar es antes de confirmar— o una fuente existente, de la que
   * se toman las credenciales guardadas si no se envían otras.
   */
  async testConnection(input: TestDataSourceConnectionInput): Promise<DataSourceConnectionTest> {
    const stored =
      input.dataSourceId === undefined ? null : await this.recordOrNotFound(input.dataSourceId);

    const settings =
      Object.keys(input.settings).length > 0 ? input.settings : (stored?.settings ?? {});

    const credentials =
      Object.keys(input.credentials).length > 0
        ? input.credentials
        : this.decryptIfAny(stored?.encryptedCredentials ?? null);

    const result = await this.testers.test(input.provider, { settings, credentials });
    const checkedAt = new Date();

    if (stored !== null) {
      await this.repository.recordCheck(stored.id, result.ok, checkedAt);
    }

    return {
      ok: result.ok,
      message: result.message,
      checkedAt: checkedAt.toISOString(),
      resources: result.resources,
    };
  }

  private definitionOf(provider: DataSourceProvider): DataSourceProviderDefinition {
    const definition = findDataSourceProvider(provider);

    if (definition === undefined) {
      throw new BadRequestException(`El proveedor ${provider} no existe en el catálogo.`);
    }

    return definition;
  }

  /**
   * Comprueba que están todos los parámetros que el proveedor declara obligatorios.
   *
   * La lista sale del catálogo y no de este archivo: añadir un parámetro a un
   * proveedor no obliga a tocar el servicio, y la pantalla que dibuja el
   * formulario y la validación que lo acepta no pueden discrepar.
   */
  private assertConfigurationIsComplete(
    definition: DataSourceProviderDefinition,
    settings: Record<string, string>,
    credentials: Record<string, string>,
    hasStoredCredentials = false,
  ): void {
    const missing = definition.fields
      .filter((field) => field.isRequired)
      .filter((field) => {
        if (field.kind === DATA_SOURCE_FIELD_KINDS.SECRET) {
          // Un secreto ya guardado cuenta como presente aunque no se reenvíe.
          return !hasStoredCredentials && isBlank(credentials[field.key]);
        }

        return isBlank(settings[field.key]);
      })
      .map((field) => field.label);

    if (missing.length > 0) {
      throw new BadRequestException(`Falta configurar: ${missing.join(', ')}.`);
    }
  }

  private async assertNameIsFree(name: string): Promise<void> {
    if ((await this.repository.findByName(name)) !== null) {
      throw new ConflictException(`Ya existe una fuente de datos llamada "${name}".`);
    }
  }

  private encryptIfAny(credentials: Record<string, string>): string | null {
    return Object.keys(credentials).length === 0
      ? null
      : encryptCredentials(credentials, this.encryptionKey);
  }

  private decryptIfAny(envelope: string | null): Record<string, string> {
    return envelope === null ? {} : decryptCredentials(envelope, this.encryptionKey);
  }

  private async recordOrNotFound(id: string): Promise<DataSourceRecord> {
    const record = await this.repository.findById(id);

    if (record === null) {
      throw new NotFoundException(`No existe ninguna fuente de datos con el identificador ${id}.`);
    }

    return record;
  }
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

/**
 * Forma en la que una fuente sale del backend.
 *
 * **Nunca incluye credenciales.** El frontend solo necesita saber si las hay, y es
 * lo único que se le dice. Es la garantía del §31 del MVP, y vive en una sola
 * función para que no pueda saltarse por descuido en un endpoint nuevo.
 */
function toSummary(record: DataSourceRecord): DataSourceSummary {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    provider: record.provider,
    settings: record.settings,
    hasCredentials: record.encryptedCredentials !== null,
    isActive: record.isActive,
    isDefault: record.isDefault,
    lastCheckedAt: record.lastCheckedAt?.toISOString() ?? null,
    lastCheckOk: record.lastCheckOk,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
