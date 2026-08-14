import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Cifrado de las credenciales de los proveedores.
 *
 * Se usa AES-256-GCM y no un cifrado simple porque GCM además **autentica**: si
 * alguien altera una fila de `data_sources`, descifrar falla en lugar de devolver
 * basura que la aplicación intentaría enviar a un servicio externo.
 *
 * Es lógica pura, sin Nest y sin base de datos, así que se prueba sin montar nada.
 *
 * ## Qué se guarda
 *
 * Un solo texto con las cuatro partes separadas por punto:
 *
 * ```
 * v1.<vector de inicialización>.<etiqueta de autenticación>.<texto cifrado>
 * ```
 *
 * Van juntas porque descifrar necesita las tres, y repartirlas en columnas
 * distintas solo añade formas de perder una. La versión al principio permite
 * cambiar de algoritmo más adelante sin tener que adivinar cómo se cifró cada
 * fila antigua.
 */

/** Etiqueta del formato actual. Cambiarla exige saber leer las anteriores. */
const FORMAT_VERSION = 'v1';

const ALGORITHM = 'aes-256-gcm';

/** AES-256 exige exactamente 32 bytes de clave. */
const KEY_BYTES = 32;

/** 12 bytes es el tamaño recomendado para el vector de inicialización de GCM. */
const IV_BYTES = 12;

/** Se lanza cuando el texto guardado no se puede descifrar con la clave actual. */
export class CredentialsDecryptionError extends Error {
  constructor() {
    super(
      'No se pudieron descifrar las credenciales. La clave de cifrado no es la que se usó para guardarlas, o el dato se alteró.',
    );
    this.name = 'CredentialsDecryptionError';
  }
}

/**
 * Interpreta la clave del entorno.
 *
 * Se admite hexadecimal y base64url porque son las dos formas naturales de
 * escribir 32 bytes en una variable de entorno, y obligar a una sola invita a
 * generar la clave a mano —que es como aparecen las claves de 12 caracteres—.
 */
export function parseEncryptionKey(raw: string): Buffer {
  const candidates = /^[0-9a-fA-F]+$/.test(raw)
    ? [Buffer.from(raw, 'hex')]
    : [Buffer.from(raw, 'base64url'), Buffer.from(raw, 'base64')];

  const key = candidates.find((candidate) => candidate.length === KEY_BYTES);

  if (key === undefined) {
    throw new Error(
      `La clave de cifrado debe codificar ${KEY_BYTES} bytes en hexadecimal o base64url. ` +
        "Generar con: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    );
  }

  return key;
}

/**
 * Cifra un conjunto de credenciales.
 *
 * Se cifra el objeto entero y no cada valor por separado: así el número de
 * credenciales que guarda una fuente tampoco queda a la vista de quien lea la
 * tabla.
 */
export function encryptCredentials(credentials: Record<string, string>, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final(),
  ]);

  return [
    FORMAT_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptCredentials(envelope: string, key: Buffer): Record<string, string> {
  const [version, iv, tag, payload] = envelope.split('.');

  if (
    version !== FORMAT_VERSION ||
    iv === undefined ||
    tag === undefined ||
    payload === undefined
  ) {
    throw new CredentialsDecryptionError();
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload, 'base64url')),
      decipher.final(),
    ]);

    return parseCredentials(decrypted.toString('utf8'));
  } catch {
    // El error original se descarta a propósito: distinguir "clave incorrecta" de
    // "dato alterado" solo ayudaría a quien está probando claves.
    throw new CredentialsDecryptionError();
  }
}

function parseCredentials(raw: string): Record<string, string> {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new CredentialsDecryptionError();
  }

  const credentials: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new CredentialsDecryptionError();
    }

    credentials[key] = value;
  }

  return credentials;
}
