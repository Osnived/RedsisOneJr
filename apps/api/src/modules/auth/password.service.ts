import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

/** Coste de bcrypt. Suficiente en 2026 sin penalizar el login de forma visible. */
const SALT_ROUNDS = 12;

/**
 * Aísla el algoritmo de hashing.
 *
 * Al vivir en su propio servicio, sustituir bcrypt por argon2 en el futuro
 * afecta a un único archivo y puede probarse de forma independiente.
 */
@Injectable()
export class PasswordService {
  hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, SALT_ROUNDS);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return compare(plainPassword, passwordHash);
  }
}
