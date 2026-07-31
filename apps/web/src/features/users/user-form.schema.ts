import { z } from 'zod';
import { passwordSchema, type CreateUserInput, type UpdateUserInput } from '@redsis/contracts';

/**
 * Forma del formulario de usuario.
 *
 * No coincide con el contrato de la API a propósito. El formulario pide Nombre y
 * Apellidos por separado porque es lo que espera quien lo rellena, mientras que
 * el backend almacena un único `fullName`. La conversión es explícita y ocurre
 * abajo, en un solo sitio.
 *
 * El rol es uno solo en el formulario aunque el backend acepte varios: hoy el
 * negocio asigna un rol por persona, y ofrecer selección múltiple sin necesidad
 * complica la pantalla.
 */
export const userFormSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  lastName: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(60),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  roleId: z.string().uuid('Selecciona un rol'),
  isActive: z.boolean(),

  /**
   * Obligatoria al crear y ausente al editar: cambiar la contraseña de otra
   * persona es una operación distinta y tendrá su propio flujo.
   */
  password: passwordSchema.optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

/** Esquema para el alta, donde la contraseña temporal sí es obligatoria. */
export const createUserFormSchema = userFormSchema.extend({
  password: passwordSchema,
});

/** Une nombre y apellidos en el único campo que almacena el backend. */
export function toFullName(values: Pick<UserFormValues, 'firstName' | 'lastName'>): string {
  return `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
}

/**
 * Separa un `fullName` en nombre y apellidos para poder editarlo.
 *
 * La primera palabra es el nombre y el resto los apellidos. Es una heurística:
 * un nombre compuesto como "Ana María Pérez" se leerá como nombre "Ana" y
 * apellidos "María Pérez". Se acepta porque el dato de origen es un solo campo y
 * cualquier reparto sería igual de arbitrario; al guardar se vuelve a unir, así
 * que el valor almacenado no se degrada.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length <= 1) {
    return { firstName: fullName.trim(), lastName: '' };
  }

  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/** Traduce el formulario al contrato de alta que espera la API. */
export function toCreateUserInput(values: UserFormValues & { password: string }): CreateUserInput {
  return {
    email: values.email,
    fullName: toFullName(values),
    password: values.password,
    roleIds: [values.roleId],
  };
}

/** Traduce el formulario al contrato de edición. */
export function toUpdateUserInput(values: UserFormValues): UpdateUserInput {
  return {
    fullName: toFullName(values),
    isActive: values.isActive,
    roleIds: [values.roleId],
  };
}
