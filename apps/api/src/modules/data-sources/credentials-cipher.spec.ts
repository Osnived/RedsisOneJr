import { randomBytes } from 'node:crypto';
import {
  CredentialsDecryptionError,
  decryptCredentials,
  encryptCredentials,
  parseEncryptionKey,
} from './credentials-cipher';

/**
 * El cifrado de credenciales es lógica pura: se ejercita sin Nest ni base de
 * datos. Lo que se comprueba no es que "funcione", sino que **falle** en los casos
 * en los que fallar es la única respuesta segura.
 */
describe('parseEncryptionKey', () => {
  it('admite una clave en base64url', () => {
    const key = randomBytes(32).toString('base64url');

    expect(parseEncryptionKey(key)).toHaveLength(32);
  });

  it('admite una clave en hexadecimal', () => {
    const key = randomBytes(32).toString('hex');

    expect(parseEncryptionKey(key)).toHaveLength(32);
  });

  it('rechaza una clave corta', () => {
    // Una clave de menos de 32 bytes produce un cifrado que parece funcionar y no
    // protege nada, así que tiene que impedir arrancar.
    expect(() => parseEncryptionKey('demasiado-corta')).toThrow(/32 bytes/);
  });

  it('el mensaje explica cómo generar una', () => {
    expect(() => parseEncryptionKey('x')).toThrow(/randomBytes/);
  });
});

describe('cifrado de credenciales', () => {
  const key = randomBytes(32);
  const credentials = { apiToken: 'rsk_ejemplo', otro: 'valor' };

  it('lo cifrado se recupera intacto', () => {
    const envelope = encryptCredentials(credentials, key);

    expect(decryptCredentials(envelope, key)).toEqual(credentials);
  });

  it('el sobre no contiene el secreto en claro', () => {
    const envelope = encryptCredentials(credentials, key);

    expect(envelope).not.toContain('rsk_ejemplo');
  });

  it('cifrar dos veces lo mismo produce sobres distintos', () => {
    // Con un vector de inicialización fijo, dos fuentes con el mismo token darían
    // el mismo texto cifrado y quien leyera la tabla sabría que coinciden.
    const first = encryptCredentials(credentials, key);
    const second = encryptCredentials(credentials, key);

    expect(first).not.toBe(second);
    expect(decryptCredentials(second, key)).toEqual(credentials);
  });

  it('declara la versión del formato', () => {
    // Permite cambiar de algoritmo sin tener que adivinar cómo se cifró cada fila.
    expect(encryptCredentials(credentials, key).startsWith('v1.')).toBe(true);
  });

  it('una clave distinta no descifra', () => {
    const envelope = encryptCredentials(credentials, key);

    expect(() => decryptCredentials(envelope, randomBytes(32))).toThrow(CredentialsDecryptionError);
  });

  it('un sobre alterado falla en lugar de devolver basura', () => {
    // Es la razón de usar GCM: además de cifrar, autentica. Sin esto, una fila
    // manipulada produciría datos que la aplicación enviaría a un servicio externo.
    const envelope = encryptCredentials(credentials, key);
    const tampered = `${envelope.slice(0, -4)}AAAA`;

    expect(() => decryptCredentials(tampered, key)).toThrow(CredentialsDecryptionError);
  });

  it('un sobre con formato desconocido falla', () => {
    expect(() => decryptCredentials('esto-no-es-un-sobre', key)).toThrow(
      CredentialsDecryptionError,
    );
    expect(() => decryptCredentials('v2.a.b.c', key)).toThrow(CredentialsDecryptionError);
  });

  it('no distingue una clave incorrecta de un dato alterado', () => {
    // Distinguirlas solo ayudaría a quien está probando claves.
    const envelope = encryptCredentials(credentials, key);
    const wrongKey = (() => {
      try {
        decryptCredentials(envelope, randomBytes(32));
        return '';
      } catch (error) {
        return (error as Error).message;
      }
    })();

    const tampered = (() => {
      try {
        decryptCredentials(`${envelope.slice(0, -4)}AAAA`, key);
        return '';
      } catch (error) {
        return (error as Error).message;
      }
    })();

    expect(wrongKey).toBe(tampered);
  });

  it('un conjunto vacío de credenciales se puede cifrar y recuperar', () => {
    expect(decryptCredentials(encryptCredentials({}, key), key)).toEqual({});
  });
});
