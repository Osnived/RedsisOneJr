/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  createUserFormSchema,
  splitFullName,
  toCreateUserInput,
  toFullName,
  toUpdateUserInput,
  userFormSchema,
  type UserFormValues,
} from './user-form.schema';

const VALID: UserFormValues = {
  firstName: 'Ana',
  lastName: 'Pérez Gómez',
  email: 'ana@redsis.com',
  roleId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  isActive: true,
  password: 'Redsis2026',
};

describe('userFormSchema', () => {
  it('acepta un formulario válido', () => {
    expect(userFormSchema.safeParse(VALID).success).toBe(true);
  });

  it('no exige contraseña al editar', () => {
    const withoutPassword = { ...VALID };
    delete withoutPassword.password;

    expect(userFormSchema.safeParse(withoutPassword).success).toBe(true);
  });

  it('normaliza el correo a minúsculas', () => {
    const result = userFormSchema.parse({ ...VALID, email: 'ANA@REDSIS.COM' });

    expect(result.email).toBe('ana@redsis.com');
  });

  it('rechaza un nombre demasiado corto', () => {
    expect(userFormSchema.safeParse({ ...VALID, firstName: 'A' }).success).toBe(false);
  });

  it('rechaza apellidos vacíos', () => {
    expect(userFormSchema.safeParse({ ...VALID, lastName: '' }).success).toBe(false);
  });

  it('rechaza un rol que no es un identificador', () => {
    expect(userFormSchema.safeParse({ ...VALID, roleId: 'supervisor' }).success).toBe(false);
  });
});

describe('createUserFormSchema', () => {
  it('exige contraseña al crear', () => {
    const withoutPassword = { ...VALID };
    delete withoutPassword.password;

    expect(createUserFormSchema.safeParse(withoutPassword).success).toBe(false);
  });

  it('aplica las reglas de contraseña de la plataforma', () => {
    expect(createUserFormSchema.safeParse({ ...VALID, password: 'corta' }).success).toBe(false);
    expect(createUserFormSchema.safeParse({ ...VALID, password: 'todominuscula1' }).success).toBe(
      false,
    );
    expect(createUserFormSchema.safeParse({ ...VALID, password: 'SinNumeros' }).success).toBe(
      false,
    );
  });
});

describe('toFullName', () => {
  it('une nombre y apellidos', () => {
    expect(toFullName({ firstName: 'Ana', lastName: 'Pérez' })).toBe('Ana Pérez');
  });

  it('descarta espacios sobrantes', () => {
    expect(toFullName({ firstName: '  Ana  ', lastName: '  Pérez  ' })).toBe('Ana Pérez');
  });

  it('funciona sin apellidos', () => {
    expect(toFullName({ firstName: 'Ana', lastName: '' })).toBe('Ana');
  });
});

describe('splitFullName', () => {
  it('separa la primera palabra como nombre', () => {
    expect(splitFullName('Ana Pérez Gómez')).toEqual({
      firstName: 'Ana',
      lastName: 'Pérez Gómez',
    });
  });

  it('deja los apellidos vacíos con una sola palabra', () => {
    expect(splitFullName('Administrador')).toEqual({
      firstName: 'Administrador',
      lastName: '',
    });
  });

  it('tolera espacios múltiples', () => {
    expect(splitFullName('  Ana   Pérez  ')).toEqual({ firstName: 'Ana', lastName: 'Pérez' });
  });

  it('no degrada el valor al ir y volver', () => {
    // Es la garantía que justifica la heurística de separación.
    const original = 'Ana Pérez Gómez';

    expect(toFullName(splitFullName(original))).toBe(original);
  });
});

describe('toCreateUserInput', () => {
  it('traduce el formulario al contrato de alta', () => {
    expect(toCreateUserInput({ ...VALID, password: 'Redsis2026' })).toEqual({
      email: 'ana@redsis.com',
      fullName: 'Ana Pérez Gómez',
      password: 'Redsis2026',
      roleIds: [VALID.roleId],
    });
  });

  it('envía el rol como arreglo, que es lo que espera la API', () => {
    const input = toCreateUserInput({ ...VALID, password: 'Redsis2026' });

    expect(Array.isArray(input.roleIds)).toBe(true);
    expect(input.roleIds).toHaveLength(1);
  });
});

describe('toUpdateUserInput', () => {
  it('traduce el formulario al contrato de edición', () => {
    expect(toUpdateUserInput(VALID)).toEqual({
      fullName: 'Ana Pérez Gómez',
      isActive: true,
      roleIds: [VALID.roleId],
    });
  });

  it('no incluye la contraseña: editar no la cambia', () => {
    expect(toUpdateUserInput(VALID)).not.toHaveProperty('password');
  });

  it('no incluye el correo: identifica la cuenta y no se modifica', () => {
    expect(toUpdateUserInput(VALID)).not.toHaveProperty('email');
  });
});
