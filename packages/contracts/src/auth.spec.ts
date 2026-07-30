import { describe, expect, it } from 'vitest';
import { changePasswordSchema, loginSchema } from './auth.js';

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    const result = loginSchema.parse({ email: 'admin@redsis.com', password: 'Redsis2026' });

    expect(result.email).toBe('admin@redsis.com');
  });

  it('normaliza el correo a minúsculas y sin espacios', () => {
    const result = loginSchema.parse({ email: '  ADMIN@REDSIS.COM  ', password: 'x' });

    expect(result.email).toBe('admin@redsis.com');
  });

  it('rechaza un correo con formato inválido', () => {
    expect(loginSchema.safeParse({ email: 'no-es-correo', password: 'x' }).success).toBe(false);
  });

  it('rechaza una contraseña vacía', () => {
    expect(loginSchema.safeParse({ email: 'admin@redsis.com', password: '' }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'Redsis2026',
    newPassword: 'NuevaClave1',
    confirmPassword: 'NuevaClave1',
  };

  it('acepta un cambio válido', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza una confirmación que no coincide', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'Otra1234' });

    expect(result.success).toBe(false);
  });

  it('rechaza reutilizar la contraseña actual', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'Redsis2026',
      newPassword: 'Redsis2026',
      confirmPassword: 'Redsis2026',
    });

    expect(result.success).toBe(false);
  });

  it('exige mayúscula, minúscula y número', () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: 'todominuscula',
        confirmPassword: 'todominuscula',
      }).success,
    ).toBe(false);
  });

  it('exige una longitud mínima de 8 caracteres', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'Ab1', confirmPassword: 'Ab1' })
        .success,
    ).toBe(false);
  });
});
