import type { ConfigService } from '@nestjs/config';
import { DATA_SOURCE_PROVIDERS, type DataSourceProvider } from '@redsis/contracts';
import type { Env } from '../../config/env.schema';
import { MockTicketProvider } from './providers/mock-ticket.provider';
import { TicketProviderRegistry } from './ticket-provider.registry';

/**
 * El registro es el único sitio donde se decide qué implementación atiende una
 * petición. Lo que se comprueba aquí es que esa decisión no pueda fallar en
 * silencio: ni sirviendo datos de prueba por descarte, ni arrancando con un
 * proveedor que no existe.
 */
describe('TicketProviderRegistry', () => {
  function registryWith(provider: DataSourceProvider): TicketProviderRegistry {
    // Un doble parcial basta: el registro solo consulta una variable.
    const configService = { get: () => provider } as unknown as ConfigService<Env, true>;

    return new TicketProviderRegistry(new MockTicketProvider(), configService);
  }

  it('resuelve el proveedor simulado, que es el único implementado', () => {
    const registry = registryWith(DATA_SOURCE_PROVIDERS.MOCK);

    expect(registry.active()).toBeInstanceOf(MockTicketProvider);
  });

  it('no arranca si el proveedor configurado está declarado y sin implementar', () => {
    // Descubrirlo con la plataforma en funcionamiento es el peor momento posible:
    // es la misma razón por la que el entorno se valida al inicio.
    const registry = registryWith(DATA_SOURCE_PROVIDERS.REDSIS_ONE);

    expect(() => registry.onModuleInit()).toThrow(/no implementado/);
  });

  it('el mensaje dice qué proveedores hay disponibles', () => {
    const registry = registryWith(DATA_SOURCE_PROVIDERS.BASEROW);

    expect(() => registry.onModuleInit()).toThrow(/mock/);
  });

  it('arranca en silencio cuando el proveedor existe', () => {
    const registry = registryWith(DATA_SOURCE_PROVIDERS.MOCK);

    expect(() => registry.onModuleInit()).not.toThrow();
  });

  it('pedir un proveedor sin implementar falla en lugar de caer al simulado', () => {
    // Servir datos de prueba creyendo que son reales es peor que no servir nada.
    const registry = registryWith(DATA_SOURCE_PROVIDERS.MOCK);

    expect(() => registry.resolve(DATA_SOURCE_PROVIDERS.SERVICENOW)).toThrow();
  });

  it('sabe distinguir lo implementado de lo declarado', () => {
    const registry = registryWith(DATA_SOURCE_PROVIDERS.MOCK);

    expect(registry.isImplemented(DATA_SOURCE_PROVIDERS.MOCK)).toBe(true);
    expect(registry.isImplemented(DATA_SOURCE_PROVIDERS.BASEROW)).toBe(false);
  });
});
