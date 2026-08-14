import { describe, expect, it } from 'vitest';
import {
  DATA_SOURCE_FIELD_KINDS,
  DATA_SOURCE_PROVIDERS,
  DATA_SOURCE_PROVIDER_DEFINITIONS,
  IMPLEMENTED_DATA_SOURCE_PROVIDERS,
  createDataSourceSchema,
  findDataSourceProvider,
  isDataSourceProvider,
  testDataSourceConnectionSchema,
  updateDataSourceSchema,
} from './data-sources.js';

describe('catálogo de proveedores', () => {
  it('declara los cinco proveedores contemplados', () => {
    const keys = DATA_SOURCE_PROVIDER_DEFINITIONS.map((definition) => definition.key);

    expect([...keys].sort()).toEqual([...Object.values(DATA_SOURCE_PROVIDERS)].sort());
  });

  it('cada proveedor aparece una sola vez', () => {
    const keys = DATA_SOURCE_PROVIDER_DEFINITIONS.map((definition) => definition.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('hoy solo el origen simulado se puede activar', () => {
    expect(IMPLEMENTED_DATA_SOURCE_PROVIDERS).toEqual([DATA_SOURCE_PROVIDERS.MOCK]);
  });

  it('el origen simulado no pide configuración', () => {
    expect(findDataSourceProvider(DATA_SOURCE_PROVIDERS.MOCK)?.fields).toHaveLength(0);
  });

  it('todo proveedor externo declara al menos un secreto', () => {
    // Si un proveedor externo no marcara ninguno, sus credenciales se guardarían
    // en claro y volverían al frontend con el resto de la configuración.
    const external = DATA_SOURCE_PROVIDER_DEFINITIONS.filter(
      (definition) =>
        definition.key !== DATA_SOURCE_PROVIDERS.MOCK &&
        definition.key !== DATA_SOURCE_PROVIDERS.DATABASE,
    );

    for (const definition of external) {
      const secrets = definition.fields.filter(
        (field) => field.kind === DATA_SOURCE_FIELD_KINDS.SECRET,
      );

      expect(secrets.length).toBeGreaterThan(0);
    }
  });

  it('ningún campo declarado se queda sin nombre visible', () => {
    for (const definition of DATA_SOURCE_PROVIDER_DEFINITIONS) {
      for (const field of definition.fields) {
        expect(field.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('reconoce un proveedor del catálogo y descarta uno inventado', () => {
    expect(isDataSourceProvider('redsis-one')).toBe(true);
    expect(isDataSourceProvider('airtable')).toBe(false);
  });
});

describe('alta de una fuente de datos', () => {
  it('acepta una fuente con sus parámetros y su credencial', () => {
    const result = createDataSourceSchema.safeParse({
      name: 'Tickets Retail',
      provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
      settings: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
      credentials: { apiToken: 'rsk_ejemplo' },
    });

    expect(result.success).toBe(true);
  });

  it('sin credenciales queda una fuente a medio configurar, no un error', () => {
    const result = createDataSourceSchema.safeParse({
      name: 'Tickets Retail',
      provider: DATA_SOURCE_PROVIDERS.MOCK,
    });

    expect(result.success).toBe(true);
    expect(result.data?.credentials).toEqual({});
  });

  it('rechaza un proveedor que no existe en el catálogo', () => {
    const result = createDataSourceSchema.safeParse({
      name: 'Tickets Retail',
      provider: 'airtable',
    });

    expect(result.success).toBe(false);
  });

  it('exige un nombre con el que distinguir la fuente', () => {
    expect(
      createDataSourceSchema.safeParse({ name: 'ab', provider: DATA_SOURCE_PROVIDERS.MOCK })
        .success,
    ).toBe(false);
  });
});

describe('actualización de una fuente de datos', () => {
  it('no deja cambiar el proveedor de una fuente ya creada', () => {
    // Cambiarlo dejaría la configuración y las columnas apuntando a un origen que
    // no las entiende. Se crea otra fuente y se retira la anterior.
    expect('provider' in updateDataSourceSchema.shape).toBe(false);
  });

  it('cambiar solo el nombre no obliga a reescribir el token', () => {
    const result = updateDataSourceSchema.safeParse({ name: 'Tickets Retail Norte' });

    expect(result.success).toBe(true);
  });
});

describe('prueba de conexión', () => {
  it('se puede comprobar una configuración antes de guardarla', () => {
    const result = testDataSourceConnectionSchema.safeParse({
      provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
      settings: { baseUrl: 'https://one.redsis.app', boardId: 'BRD-GVF3CC' },
      credentials: { apiToken: 'rsk_ejemplo' },
    });

    expect(result.success).toBe(true);
  });

  it('al probar una fuente guardada basta con señalarla', () => {
    const result = testDataSourceConnectionSchema.safeParse({
      provider: DATA_SOURCE_PROVIDERS.REDSIS_ONE,
      dataSourceId: '3f1a8c9e-6b2d-4f7a-9c1e-2d5b8a4f7c30',
    });

    expect(result.success).toBe(true);
    expect(result.data?.credentials).toEqual({});
  });
});
