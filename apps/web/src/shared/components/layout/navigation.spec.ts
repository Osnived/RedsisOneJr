/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { ALL_APP_MODULES, APP_MODULES } from '@redsis/contracts';
import { createAuthorizationService } from '@/shared/lib/authorization';
import { buildNavigation } from './navigation';

function navigationFor(modules: string[]) {
  return buildNavigation(createAuthorizationService({ modules, permissions: [] }));
}

describe('buildNavigation', () => {
  it('no muestra nada sin accesos', () => {
    expect(navigationFor([])).toEqual([]);
  });

  it('muestra solo los módulos concedidos', () => {
    const items = navigationFor([APP_MODULES.DASHBOARD, APP_MODULES.TICKETS]);

    expect(items.map((item) => item.module)).toEqual([APP_MODULES.DASHBOARD, APP_MODULES.TICKETS]);
  });

  it('un módulo retirado desaparece del menú', () => {
    // Es el resultado esperado del MVP 9: no hay menús por rol.
    const before = navigationFor([APP_MODULES.TICKETS, APP_MODULES.USERS]);
    const after = navigationFor([APP_MODULES.TICKETS]);

    expect(before).toHaveLength(2);
    expect(after.map((item) => item.module)).toEqual([APP_MODULES.TICKETS]);
  });

  it('descarta los módulos que todavía no tienen pantalla', () => {
    // Conceder Clientes es válido; enlazar a una ruta que no existe, no.
    const items = navigationFor([APP_MODULES.CLIENTS, APP_MODULES.REPORTS]);

    expect(items).toEqual([]);
  });

  it('con acceso total muestra un enlace por módulo con pantalla', () => {
    const items = navigationFor([...ALL_APP_MODULES]);

    expect(items.map((item) => item.to)).toEqual(['/', '/tickets', '/users', '/security']);
  });

  it('cada elemento lleva su etiqueta y su icono', () => {
    const [item] = navigationFor([APP_MODULES.SECURITY]);

    expect(item?.label).toBe('Seguridad');
    expect(item?.icon).toBeDefined();
  });
});
