/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { APP_MODULES } from '@redsis/contracts';
import { findModuleForPath } from './route-module';

describe('findModuleForPath', () => {
  it('resuelve el panel en la raíz', () => {
    expect(findModuleForPath('/')?.key).toBe(APP_MODULES.DASHBOARD);
  });

  it('resuelve una ruta de módulo', () => {
    expect(findModuleForPath('/tickets')?.key).toBe(APP_MODULES.TICKETS);
  });

  it('resuelve Seguridad', () => {
    expect(findModuleForPath('/security')?.key).toBe(APP_MODULES.SECURITY);
  });

  it('una ruta hija hereda el módulo del padre', () => {
    // El detalle de un ticket pertenece a Tickets: nadie debe declararlo aparte.
    expect(findModuleForPath('/tickets/INC-2026-000101')?.key).toBe(APP_MODULES.TICKETS);
  });

  it('la raíz no es el prefijo de todo', () => {
    // Sin comparar la raíz de forma exacta, cualquier ruta sería del Panel.
    expect(findModuleForPath('/users')?.key).toBe(APP_MODULES.USERS);
  });

  it('no inventa un módulo para una ruta desconocida', () => {
    expect(findModuleForPath('/pantalla-inexistente')).toBeNull();
  });

  it('no confunde una ruta con otra que empieza igual', () => {
    expect(findModuleForPath('/ticketsonline')).toBeNull();
  });
});
