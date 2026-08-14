/**
 * Fuentes de datos de la plataforma.
 *
 * Una fuente de datos es un **proyecto**: un tablero concreto de un proveedor
 * concreto, con su estructura de columnas propia. Dos proyectos pueden usar
 * proveedores distintos y no parecerse en nada, y esa es exactamente la razón por
 * la que la configuración se administra y no se programa.
 *
 * ## Qué NO viaja al frontend
 *
 * Ningún secreto, nunca. Las credenciales se envían al crear o actualizar y no
 * vuelven jamás: la API responde con `hasCredentials` y con nada más. La conexión
 * real con el proveedor ocurre siempre en NestJS (ver §18 y §31 del MVP y
 * AGENTS.md); React no conoce URLs, ni tokens, ni la estructura del origen.
 */

import { z } from 'zod';

/**
 * Proveedores contemplados.
 *
 * Se declaran los cinco desde el principio para que añadir uno sea implementar su
 * Provider y no ampliar el contrato ni las pantallas que ya lo consumen. Cuáles
 * funcionan de verdad lo dice `isImplemented` en su definición, no esta lista.
 */
export const DATA_SOURCE_PROVIDERS = {
  MOCK: 'mock',
  REDSIS_ONE: 'redsis-one',
  BASEROW: 'baserow',
  SERVICENOW: 'servicenow',
  DATABASE: 'database',
} as const;

export type DataSourceProvider = (typeof DATA_SOURCE_PROVIDERS)[keyof typeof DATA_SOURCE_PROVIDERS];

/**
 * Clase de un parámetro de configuración.
 *
 * `secret` es lo que decide que un valor se cifre al guardarlo y no se devuelva
 * nunca. Es una propiedad del dato, no de la pantalla: si dependiera de que el
 * formulario recuerde pintar un campo de contraseña, un formulario nuevo podría
 * olvidarlo y el token viajaría en claro.
 */
export const DATA_SOURCE_FIELD_KINDS = {
  TEXT: 'text',
  URL: 'url',
  SECRET: 'secret',
} as const;

export type DataSourceFieldKind =
  (typeof DATA_SOURCE_FIELD_KINDS)[keyof typeof DATA_SOURCE_FIELD_KINDS];

/**
 * Un parámetro que pide un proveedor.
 *
 * La pantalla de administración dibuja los campos que el proveedor declara, sin
 * saber cuáles son. Es lo que evita la lógica dispersa que prohíbe el §9 del MVP:
 * no hay ningún `if (provider === 'redsis-one')` en React porque no hace falta.
 */
export interface DataSourceFieldDefinition {
  key: string;
  label: string;
  kind: DataSourceFieldKind;
  isRequired: boolean;
  placeholder: string | null;
  /** Explicación breve bajo el campo. Nula si el nombre ya se explica solo. */
  help: string | null;
}

/**
 * Qué es cada proveedor y qué necesita.
 *
 * `isImplemented` distingue lo que existe de lo que está declarado, igual que
 * `IMPLEMENTED_CAPABILITIES` en el framework de tablas: una fuente con un
 * proveedor sin implementar se puede describir pero no se puede activar, y la
 * pantalla lo dice en lugar de fallar al usarla.
 */
export interface DataSourceProviderDefinition {
  key: DataSourceProvider;
  label: string;
  description: string;
  isImplemented: boolean;

  /**
   * Si el proveedor sabe enumerar sus recursos (tableros, tablas) para que se
   * elijan de una lista en lugar de escribir el identificador a mano.
   */
  supportsResourceDiscovery: boolean;

  fields: readonly DataSourceFieldDefinition[];
}

/**
 * Catálogo de proveedores.
 *
 * Los parámetros de RedsisOne salen de su documentación OpenAPI
 * (`docs/RedsisOne-EndPoints.yaml`): base `https://one.redsis.app`, cabecera
 * `Authorization: Bearer rsk_...` y un tablero identificado por código corto
 * (`BRD-GVF3CC`) o por UUID. No se inventa ningún endpoint ni ninguna forma de
 * autenticación.
 */
export const DATA_SOURCE_PROVIDER_DEFINITIONS: readonly DataSourceProviderDefinition[] = [
  {
    key: DATA_SOURCE_PROVIDERS.MOCK,
    label: 'Datos simulados',
    description: 'Origen en memoria para desarrollo y pruebas. No requiere configuración.',
    isImplemented: true,
    supportsResourceDiscovery: false,
    fields: [],
  },
  {
    key: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
    label: 'RedsisOne / OneBoards',
    description: 'Tableros de RedsisOne. Cada tablero es un proyecto con sus propias columnas.',
    isImplemented: false,
    supportsResourceDiscovery: true,
    fields: [
      {
        key: 'baseUrl',
        label: 'URL del servicio',
        kind: DATA_SOURCE_FIELD_KINDS.URL,
        isRequired: true,
        placeholder: 'https://one.redsis.app',
        help: null,
      },
      {
        key: 'apiToken',
        label: 'Token de acceso',
        kind: DATA_SOURCE_FIELD_KINDS.SECRET,
        isRequired: true,
        placeholder: null,
        help: 'Se envía como Bearer. Se guarda cifrado y no vuelve a mostrarse.',
      },
      {
        key: 'boardId',
        label: 'Tablero',
        kind: DATA_SOURCE_FIELD_KINDS.TEXT,
        isRequired: true,
        placeholder: 'BRD-GVF3CC',
        help: 'Código corto o identificador del tablero que contiene los tickets.',
      },
    ],
  },
  {
    key: DATA_SOURCE_PROVIDERS.BASEROW,
    label: 'Baserow',
    description: 'Tablas de Baserow como origen de datos operacionales.',
    isImplemented: false,
    supportsResourceDiscovery: true,
    fields: [
      {
        key: 'baseUrl',
        label: 'URL del servicio',
        kind: DATA_SOURCE_FIELD_KINDS.URL,
        isRequired: true,
        placeholder: 'https://api.baserow.io',
        help: null,
      },
      {
        key: 'apiToken',
        label: 'Token de base de datos',
        kind: DATA_SOURCE_FIELD_KINDS.SECRET,
        isRequired: true,
        placeholder: null,
        help: 'Se guarda cifrado y no vuelve a mostrarse.',
      },
      {
        key: 'tableId',
        label: 'Tabla',
        kind: DATA_SOURCE_FIELD_KINDS.TEXT,
        isRequired: true,
        placeholder: null,
        help: null,
      },
    ],
  },
  {
    key: DATA_SOURCE_PROVIDERS.SERVICENOW,
    label: 'ServiceNow',
    description: 'Incidentes de una instancia de ServiceNow.',
    isImplemented: false,
    supportsResourceDiscovery: false,
    fields: [
      {
        key: 'instanceUrl',
        label: 'URL de la instancia',
        kind: DATA_SOURCE_FIELD_KINDS.URL,
        isRequired: true,
        placeholder: 'https://ejemplo.service-now.com',
        help: null,
      },
      {
        key: 'username',
        label: 'Usuario',
        kind: DATA_SOURCE_FIELD_KINDS.TEXT,
        isRequired: true,
        placeholder: null,
        help: null,
      },
      {
        key: 'password',
        label: 'Contraseña',
        kind: DATA_SOURCE_FIELD_KINDS.SECRET,
        isRequired: true,
        placeholder: null,
        help: 'Se guarda cifrada y no vuelve a mostrarse.',
      },
      {
        key: 'table',
        label: 'Tabla',
        kind: DATA_SOURCE_FIELD_KINDS.TEXT,
        isRequired: true,
        placeholder: 'incident',
        help: null,
      },
    ],
  },
  {
    key: DATA_SOURCE_PROVIDERS.DATABASE,
    label: 'Base de datos propia',
    description:
      'Tickets almacenados en la PostgreSQL de la plataforma. Declarado y sin implementar.',
    isImplemented: false,
    supportsResourceDiscovery: false,
    fields: [],
  },
];

export function findDataSourceProvider(key: string): DataSourceProviderDefinition | undefined {
  return DATA_SOURCE_PROVIDER_DEFINITIONS.find((definition) => definition.key === key);
}

export function isDataSourceProvider(value: string): value is DataSourceProvider {
  return DATA_SOURCE_PROVIDER_DEFINITIONS.some((definition) => definition.key === value);
}

/** Proveedores que se pueden activar hoy. */
export const IMPLEMENTED_DATA_SOURCE_PROVIDERS: readonly DataSourceProvider[] =
  DATA_SOURCE_PROVIDER_DEFINITIONS.filter((definition) => definition.isImplemented).map(
    (definition) => definition.key,
  );

/**
 * Una fuente de datos tal como la entrega la API.
 *
 * **No contiene ningún secreto.** `settings` lleva solo los parámetros no
 * sensibles —la URL, el identificador del tablero—; los que el proveedor declaró
 * como `secret` viajaron una vez hacia el servidor y no salen de ahí.
 */
export interface DataSourceSummary {
  id: string;
  name: string;
  description: string | null;
  provider: DataSourceProvider;

  /** Parámetros no sensibles, por su clave. */
  settings: Record<string, string>;

  /** Si tiene credenciales guardadas. Nunca cuáles. */
  hasCredentials: boolean;

  isActive: boolean;

  /**
   * La fuente que se usa cuando no se pide un proyecto concreto.
   *
   * Existe una sola: sin ella, la pantalla de Tickets no sabría qué mostrar
   * mientras no haya selector de proyecto.
   */
  isDefault: boolean;

  /** Resultado de la última comprobación de conexión, si se hizo alguna. */
  lastCheckedAt: string | null;
  lastCheckOk: boolean | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Un recurso del proveedor: un tablero de RedsisOne, una tabla de Baserow.
 *
 * Se descubre preguntándole al proveedor, para que administrar una fuente sea
 * elegir de una lista en lugar de copiar identificadores a mano.
 */
export interface DataSourceResource {
  id: string;
  name: string;
}

/**
 * Resultado de "Probar conexión".
 *
 * Devuelve un mensaje legible y no el error del proveedor tal cual: un fallo de
 * autenticación no debe imprimir en pantalla la cabecera que se envió.
 */
export interface DataSourceConnectionTest {
  ok: boolean;
  message: string;
  checkedAt: string;

  /** Recursos encontrados, si el proveedor sabe enumerarlos. */
  resources: DataSourceResource[];
}

const settingsSchema = z.record(z.string(), z.string());

export const createDataSourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(80, 'El nombre no puede pasar de 80 caracteres'),
  description: z
    .string()
    .trim()
    .max(200, 'La descripción no puede pasar de 200 caracteres')
    .optional(),
  provider: z.enum(
    Object.values(DATA_SOURCE_PROVIDERS) as [DataSourceProvider, ...DataSourceProvider[]],
  ),
  settings: settingsSchema.default({}),

  /**
   * Valores sensibles, por su clave. Solo viajan de ida.
   *
   * Al actualizar se omiten para conservar los guardados: obligar a reescribir el
   * token para cambiar el nombre de una fuente llevaría a copiarlo y pegarlo, que
   * es justo como se filtran los secretos.
   */
  credentials: settingsSchema.default({}),

  isActive: z.boolean().default(true),
});

export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>;

export const updateDataSourceSchema = createDataSourceSchema.partial().omit({ provider: true });

export type UpdateDataSourceInput = z.infer<typeof updateDataSourceSchema>;

/**
 * Comprobación de una configuración **antes** de guardarla.
 *
 * Se envía la configuración completa y no el identificador de una fuente ya
 * guardada, porque el momento útil para probar es antes de confirmar. Cuando se
 * prueba una existente, las credenciales se omiten y el servidor usa las suyas.
 */
export const testDataSourceConnectionSchema = z.object({
  provider: z.enum(
    Object.values(DATA_SOURCE_PROVIDERS) as [DataSourceProvider, ...DataSourceProvider[]],
  ),
  settings: settingsSchema.default({}),
  credentials: settingsSchema.default({}),

  /** Fuente guardada de la que tomar las credenciales que no se envíen. */
  dataSourceId: z.string().uuid().optional(),
});

export type TestDataSourceConnectionInput = z.infer<typeof testDataSourceConnectionSchema>;
