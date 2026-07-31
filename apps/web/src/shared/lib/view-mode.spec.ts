/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { SYSTEM_ROLES } from '@redsis/contracts';
import { resolveViewMode } from './view-mode';

describe('resolveViewMode', () => {
  it('un técnico en móvil ve tarjetas', () => {
    expect(resolveViewMode({ roles: [SYSTEM_ROLES.TECHNICIAN], isMobile: true })).toEqual({
      mode: 'cards',
      reason: 'tecnico-en-movil',
    });
  });

  it('un técnico en escritorio ve la tabla', () => {
    expect(resolveViewMode({ roles: [SYSTEM_ROLES.TECHNICIAN], isMobile: false })).toEqual({
      mode: 'table',
      reason: 'predeterminado',
    });
  });

  it('un administrador en móvil ve la tabla', () => {
    // La decisión no es solo del tamaño de pantalla: el rol también cuenta.
    expect(resolveViewMode({ roles: [SYSTEM_ROLES.ADMINISTRATOR], isMobile: true })).toEqual({
      mode: 'table',
      reason: 'predeterminado',
    });
  });

  it('un usuario sin roles ve la tabla', () => {
    expect(resolveViewMode({ roles: [], isMobile: true })).toEqual({
      mode: 'table',
      reason: 'predeterminado',
    });
  });

  it('reconoce al técnico entre varios roles', () => {
    const decision = resolveViewMode({
      roles: [SYSTEM_ROLES.SUPERVISOR, SYSTEM_ROLES.TECHNICIAN],
      isMobile: true,
    });

    expect(decision.mode).toBe('cards');
  });

  describe('preferencia del usuario', () => {
    it('gana sobre la decisión automática', () => {
      expect(
        resolveViewMode({
          roles: [SYSTEM_ROLES.TECHNICIAN],
          isMobile: true,
          preference: 'table',
        }),
      ).toEqual({ mode: 'table', reason: 'preferencia' });
    });

    it('permite tarjetas donde no tocarían', () => {
      expect(
        resolveViewMode({
          roles: [SYSTEM_ROLES.ADMINISTRATOR],
          isMobile: false,
          preference: 'cards',
        }),
      ).toEqual({ mode: 'cards', reason: 'preferencia' });
    });

    it('no se aplica cuando está sin definir', () => {
      const decision = resolveViewMode({
        roles: [SYSTEM_ROLES.TECHNICIAN],
        isMobile: true,
        preference: null,
      });

      expect(decision.reason).toBe('tecnico-en-movil');
    });
  });
});
