import { z } from 'zod';
import { DATA_SOURCE_PROVIDERS, type DataSourceProvider } from '@redsis/contracts';

/**
 * Contrato de las variables de entorno.
 *
 * Toda configuración proviene de variables de entorno (STACK.md). La aplicación
 * no arranca si falta una variable obligatoria: es preferible fallar al inicio
 * que descubrir el problema en producción.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_SECRET debe tener al menos 32 caracteres'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  /**
   * Origen de los tickets.
   *
   * Es provisional: cuando las fuentes de datos se administren desde la pantalla
   * de Configuración, el proveedor saldrá de la fuente y esta variable dejará de
   * decidir nada. Existe ahora para que el registro de proveedores tenga qué
   * resolver antes de que exista esa pantalla.
   *
   * Un proveedor declarado pero sin implementar impide arrancar: es preferible a
   * descubrirlo cuando alguien abre la pantalla de Tickets.
   */
  TICKETS_PROVIDER: z
    .enum(Object.values(DATA_SOURCE_PROVIDERS) as [DataSourceProvider, ...DataSourceProvider[]])
    .default(DATA_SOURCE_PROVIDERS.MOCK),

  /**
   * Clave con la que se cifran las credenciales de los proveedores externos.
   *
   * 32 bytes en base64url o hexadecimal: es lo que exige AES-256. Se valida al
   * arrancar como el resto de secretos, porque una clave corta produce un cifrado
   * que parece funcionar y no protege nada.
   *
   * **Custodiarla es parte del despliegue.** Si se pierde, las credenciales
   * guardadas dejan de poder descifrarse y hay que volver a introducirlas; si se
   * filtra, valen tanto como los tokens que protege.
   */
  DATA_SOURCE_ENCRYPTION_KEY: z
    .string()
    .min(32, 'DATA_SOURCE_ENCRYPTION_KEY debe codificar 32 bytes (base64url o hexadecimal)'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida el entorno recibido. Lanza un error legible cuando algo falta,
 * en lugar de dejar que la aplicación arranque a medias.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${details}`);
  }

  return result.data;
}

/** Secretos que nunca deben usarse fuera de desarrollo. */
const INSECURE_SECRETS = new Set([
  'change-me-in-production-change-me-in-production',
  'development-only-secret-development-only',
]);

/** El entorno de producción no admite secretos de ejemplo. */
export function assertProductionSafety(env: Env): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (INSECURE_SECRETS.has(env.JWT_SECRET) || INSECURE_SECRETS.has(env.REFRESH_TOKEN_SECRET)) {
    throw new Error('Los secretos de ejemplo no pueden utilizarse en producción');
  }

  if (env.JWT_SECRET === env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT_SECRET y REFRESH_TOKEN_SECRET deben ser distintos');
  }

  if (INSECURE_SECRETS.has(env.DATA_SOURCE_ENCRYPTION_KEY)) {
    throw new Error('La clave de cifrado de ejemplo no puede utilizarse en producción');
  }
}
