import { z } from 'zod';

/**
 * Reglas de contraseña de la plataforma.
 *
 * Vive en un único archivo porque antes estaba escrita dos veces —en el alta de
 * usuario y en el cambio de contraseña— y endurecer la política habría exigido
 * acordarse de los dos sitios.
 *
 * El máximo de 72 no es arbitrario: bcrypt ignora los bytes que pasan de ahí, y
 * aceptar más daría la falsa impresión de una contraseña más fuerte.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/\d/, 'Debe incluir al menos un número');
