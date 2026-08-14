/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import {
  DATA_SOURCE_PROVIDERS,
  PERMISSIONS,
  type DataSourceSummary,
  type Permission,
} from '@redsis/contracts';
import { buildDataSourceActions } from './data-source-actions';

/**
 * Qué acciones se ofrecen sobre una fuente.
 *
 * Es lógica pura: no monta nada. Lo que se comprueba es que la pantalla no ofrezca
 * algo que el backend va a negar, ni oculte algo que sí se puede hacer.
 */

function sourceOf(overrides: Partial<DataSourceSummary> = {}): DataSourceSummary {
  return {
    id: 'fuente-1',
    name: 'Tickets Retail',
    description: null,
    provider: DATA_SOURCE_PROVIDERS.MOCK,
    settings: {},
    hasCredentials: false,
    isActive: true,
    isDefault: false,
    lastCheckedAt: null,
    lastCheckOk: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

function actionsFor(permissions: Permission[]) {
  return buildDataSourceActions({
    can: (permission) => permissions.includes(permission),
    onEdit: vi.fn(),
    onSetDefault: vi.fn(),
    onRemove: vi.fn(),
  });
}

/** Identificadores de las acciones que se ven sobre una fuente concreta. */
function visibleOn(source: DataSourceSummary, permissions: Permission[]): string[] {
  return actionsFor(permissions)
    .filter((action) => action.isHidden?.(source) !== true)
    .map((action) => action.id);
}

const ALL: Permission[] = [PERMISSIONS.DATA_SOURCES_EDIT, PERMISSIONS.DATA_SOURCES_DELETE];

describe('acciones sobre una fuente de datos', () => {
  it('quien solo consulta no puede hacer nada', () => {
    expect(visibleOn(sourceOf(), [PERMISSIONS.DATA_SOURCES_VIEW])).toEqual([]);
  });

  it('con permiso de edición se puede editar y designar por defecto', () => {
    expect(visibleOn(sourceOf(), [PERMISSIONS.DATA_SOURCES_EDIT])).toEqual(['edit', 'set-default']);
  });

  it('retirar exige su propio permiso', () => {
    expect(visibleOn(sourceOf(), [PERMISSIONS.DATA_SOURCES_EDIT])).not.toContain('remove');
    expect(visibleOn(sourceOf(), ALL)).toContain('remove');
  });

  it('la fuente por defecto no se puede retirar', () => {
    // Dejaría la pantalla de Tickets sin saber a quién preguntar. El backend lo
    // rechaza igualmente; ocultarlo evita ofrecer algo que se va a negar.
    expect(visibleOn(sourceOf({ isDefault: true }), ALL)).not.toContain('remove');
  });

  it('la que ya es la de por defecto no se vuelve a designar', () => {
    expect(visibleOn(sourceOf({ isDefault: true }), ALL)).not.toContain('set-default');
  });

  it('una fuente desactivada no puede ser la de por defecto', () => {
    expect(visibleOn(sourceOf({ isActive: false }), ALL)).not.toContain('set-default');
  });

  it('una fuente desactivada sí se puede editar y retirar', () => {
    expect(visibleOn(sourceOf({ isActive: false }), ALL)).toEqual(['edit', 'remove']);
  });
});
