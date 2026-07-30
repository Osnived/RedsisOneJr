import { assertProductionSafety, validateEnv } from './env.schema';

const VALID_ENV = {
  DATABASE_URL: 'postgresql://redsis:redsis@localhost:5432/redsis',
  JWT_SECRET: 'a'.repeat(32),
  REFRESH_TOKEN_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('aplica valores por defecto para las variables opcionales', () => {
    const env = validateEnv({ ...VALID_ENV });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('15m');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('convierte el puerto a número', () => {
    const env = validateEnv({ ...VALID_ENV, PORT: '4000' });

    expect(env.PORT).toBe(4000);
  });

  it('interpreta SWAGGER_ENABLED como booleano', () => {
    expect(validateEnv({ ...VALID_ENV, SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED).toBe(false);
    expect(validateEnv({ ...VALID_ENV, SWAGGER_ENABLED: 'true' }).SWAGGER_ENABLED).toBe(true);
  });

  it('falla si falta DATABASE_URL', () => {
    const withoutDatabase = {
      JWT_SECRET: VALID_ENV.JWT_SECRET,
      REFRESH_TOKEN_SECRET: VALID_ENV.REFRESH_TOKEN_SECRET,
    };

    expect(() => validateEnv(withoutDatabase)).toThrow(/DATABASE_URL/);
  });

  it('rechaza secretos demasiado cortos', () => {
    expect(() => validateEnv({ ...VALID_ENV, JWT_SECRET: 'corto' })).toThrow(/JWT_SECRET/);
  });

  it('rechaza un entorno desconocido', () => {
    expect(() => validateEnv({ ...VALID_ENV, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rechaza un puerto fuera de rango', () => {
    expect(() => validateEnv({ ...VALID_ENV, PORT: '99999' })).toThrow(/PORT/);
  });
});

describe('assertProductionSafety', () => {
  it('no impone restricciones fuera de producción', () => {
    const env = validateEnv({
      ...VALID_ENV,
      NODE_ENV: 'development',
      JWT_SECRET: 'development-only-secret-development-only',
      REFRESH_TOKEN_SECRET: 'development-only-secret-development-only',
    });

    expect(() => assertProductionSafety(env)).not.toThrow();
  });

  it('rechaza los secretos de ejemplo en producción', () => {
    const env = validateEnv({
      ...VALID_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: 'development-only-secret-development-only',
    });

    expect(() => assertProductionSafety(env)).toThrow(/secretos de ejemplo/);
  });

  it('exige que el secreto de acceso y el de refresco sean distintos en producción', () => {
    const shared = 'c'.repeat(40);
    const env = validateEnv({
      ...VALID_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: shared,
      REFRESH_TOKEN_SECRET: shared,
    });

    expect(() => assertProductionSafety(env)).toThrow(/deben ser distintos/);
  });

  it('acepta una configuración de producción correcta', () => {
    const env = validateEnv({ ...VALID_ENV, NODE_ENV: 'production' });

    expect(() => assertProductionSafety(env)).not.toThrow();
  });
});
