import { Injectable } from '@nestjs/common';
import {
  DATA_SOURCE_PROVIDERS,
  findDataSourceProvider,
  type DataSourceProvider,
  type DataSourceResource,
} from '@redsis/contracts';

/**
 * Comprobación de que una configuración sirve para conectarse.
 *
 * Es lo que respalda el botón "Probar conexión": permite descubrir que un token
 * caducó o que un tablero no existe **antes** de guardar, en lugar de con la
 * pantalla de Tickets vacía.
 *
 * Se resuelve por proveedor igual que el Repository de Tickets, y por el mismo
 * motivo: un condicional por proveedor obligaría a tocar este archivo cada vez
 * que aparezca uno nuevo (ver ADR 0003).
 */

/** Lo que se le entrega a un probador. Las credenciales llegan ya descifradas. */
export interface ConnectionAttempt {
  settings: Record<string, string>;
  credentials: Record<string, string>;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
  /** Recursos encontrados, si el proveedor sabe enumerarlos. */
  resources: DataSourceResource[];
}

export interface DataSourceConnectionTester {
  test(attempt: ConnectionAttempt): Promise<ConnectionResult>;
}

/** El origen simulado siempre responde: no hay nada al otro lado que pueda fallar. */
@Injectable()
export class MockConnectionTester implements DataSourceConnectionTester {
  test(): Promise<ConnectionResult> {
    return Promise.resolve({
      ok: true,
      message: 'Origen simulado disponible. No requiere configuración.',
      resources: [],
    });
  }
}

/**
 * Qué probador atiende a cada proveedor.
 *
 * Un proveedor ausente del mapa está declarado y sin implementar: se informa con
 * un mensaje claro en lugar de dar por buena una conexión que nadie comprobó.
 */
@Injectable()
export class ConnectionTesterRegistry {
  private readonly testers: ReadonlyMap<DataSourceProvider, DataSourceConnectionTester>;

  constructor(mockTester: MockConnectionTester) {
    this.testers = new Map<DataSourceProvider, DataSourceConnectionTester>([
      [DATA_SOURCE_PROVIDERS.MOCK, mockTester],
    ]);
  }

  async test(provider: DataSourceProvider, attempt: ConnectionAttempt): Promise<ConnectionResult> {
    const tester = this.testers.get(provider);

    if (tester === undefined) {
      const label = findDataSourceProvider(provider)?.label ?? provider;

      return {
        ok: false,
        message: `El proveedor ${label} está declarado y todavía no se puede conectar.`,
        resources: [],
      };
    }

    return tester.test(attempt);
  }

  isImplemented(provider: DataSourceProvider): boolean {
    return this.testers.has(provider);
  }
}
