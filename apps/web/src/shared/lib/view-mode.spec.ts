/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { resolveViewMode } from './view-mode';

describe('resolveViewMode', () => {
  it('en móvil, quien no administra ve tarjetas', () => {
    expect(resolveViewMode({ administersPlatform: false, isMobile: true })).toEqual({
      mode: 'cards',
      reason: 'movil-sin-administracion',
    });
  });

  it('en escritorio se ve la tabla aunque no administre', () => {
    expect(resolveViewMode({ administersPlatform: false, isMobile: false })).toEqual({
      mode: 'table',
      reason: 'predeterminado',
    });
  });

  it('quien administra ve la tabla también en móvil', () => {
    // La decisión no es solo del tamaño de pantalla: lo que el usuario puede
    // hacer también cuenta.
    expect(resolveViewMode({ administersPlatform: true, isMobile: true })).toEqual({
      mode: 'table',
      reason: 'predeterminado',
    });
  });

  it('quien administra ve la tabla en escritorio', () => {
    expect(resolveViewMode({ administersPlatform: true, isMobile: false }).mode).toBe('table');
  });

  describe('preferencia del usuario', () => {
    it('gana sobre la decisión automática', () => {
      expect(
        resolveViewMode({ administersPlatform: false, isMobile: true, preference: 'table' }),
      ).toEqual({ mode: 'table', reason: 'preferencia' });
    });

    it('permite tarjetas donde no tocarían', () => {
      expect(
        resolveViewMode({ administersPlatform: true, isMobile: false, preference: 'cards' }),
      ).toEqual({ mode: 'cards', reason: 'preferencia' });
    });

    it('no se aplica cuando está sin definir', () => {
      const decision = resolveViewMode({
        administersPlatform: false,
        isMobile: true,
        preference: null,
      });

      expect(decision.reason).toBe('movil-sin-administracion');
    });
  });
});
