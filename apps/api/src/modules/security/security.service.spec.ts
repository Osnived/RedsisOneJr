import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { APP_MODULES, PERMISSIONS, type RoleSummary } from '@redsis/contracts';
import type { ActivityLogService } from '../activity-log/activity-log.service';
import type { SecurityRepository } from './security.repository';
import { SecurityService } from './security.service';
import type { RoleAccessChange } from './security.types';

const ADMIN_ROLE: RoleSummary = {
  id: 'role-admin',
  name: 'administrador',
  description: null,
  isSystem: true,
  isActive: true,
  hasFullAccess: false,
  modules: [APP_MODULES.SECURITY, APP_MODULES.TICKETS],
  permissions: [PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLES_EDIT],
  userCount: 1,
};

const CUSTOM_ROLE: RoleSummary = {
  id: 'role-coord',
  name: 'coordinador',
  description: null,
  isSystem: false,
  isActive: true,
  hasFullAccess: false,
  modules: [APP_MODULES.TICKETS],
  permissions: [PERMISSIONS.TICKETS_VIEW],
  userCount: 0,
};

/**
 * Doble parcial del Repository: solo lo que cada prueba ejercita.
 *
 * Se registra la última llamada a `replaceRoleAccess` para poder comprobar qué
 * se habría persistido, que es lo que de verdad importa en un cambio de accesos.
 */
function buildService(overrides: Partial<SecurityRepository> = {}) {
  const changes: RoleAccessChange[] = [];
  const recorded: unknown[] = [];

  const findRole = (id: string): RoleSummary | null =>
    [ADMIN_ROLE, CUSTOM_ROLE].find((role) => role.id === id) ?? null;

  const repository: SecurityRepository = {
    listRoles: jest.fn(() => Promise.resolve([ADMIN_ROLE, CUSTOM_ROLE])),
    findRoleById: jest.fn((id: string) => Promise.resolve(findRole(id))),
    findRoleByName: jest.fn(() => Promise.resolve(null)),
    createRole: jest.fn(() => Promise.resolve(CUSTOM_ROLE)),
    updateRole: jest.fn(() => Promise.resolve(CUSTOM_ROLE)),
    findRoleAccess: jest.fn((id: string) => {
      const role = findRole(id);

      return Promise.resolve(
        role ? { modules: role.modules, permissions: role.permissions } : null,
      );
    }),
    replaceRoleAccess: jest.fn((change: RoleAccessChange) => {
      changes.push(change);

      return Promise.resolve(CUSTOM_ROLE);
    }),
    listAccessAudit: jest.fn(() => Promise.resolve([])),
    ...overrides,
  };

  const activityLog = {
    record: jest.fn((entry: unknown) => {
      recorded.push(entry);

      return Promise.resolve();
    }),
  } as unknown as ActivityLogService;

  return { service: new SecurityService(repository, activityLog), repository, changes, recorded };
}

describe('SecurityService', () => {
  describe('findRoleById', () => {
    it('falla si el rol no existe', async () => {
      const { service } = buildService();

      await expect(service.findRoleById('desconocido')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createRole', () => {
    it('crea el rol sin accesos', async () => {
      const { service, repository } = buildService();

      await service.createRole({ name: 'coordinador' });

      expect(repository.createRole).toHaveBeenCalledWith({
        name: 'coordinador',
        description: null,
      });
    });

    it('rechaza un nombre repetido', async () => {
      const { service } = buildService({
        findRoleByName: jest.fn(() => Promise.resolve(CUSTOM_ROLE)),
      });

      await expect(service.createRole({ name: 'coordinador' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('updateRole', () => {
    it('desactiva un rol propio', async () => {
      const { service, repository } = buildService();

      await service.updateRole(CUSTOM_ROLE.id, { isActive: false });

      expect(repository.updateRole).toHaveBeenCalledWith(CUSTOM_ROLE.id, { isActive: false });
    });

    it('no permite desactivar un rol del sistema', async () => {
      // Dejaría la plataforma sin administración y nadie podría revertirlo.
      const { service } = buildService();

      await expect(service.updateRole(ADMIN_ROLE.id, { isActive: false })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rechaza renombrar a un nombre ya usado', async () => {
      const { service } = buildService({
        findRoleByName: jest.fn(() => Promise.resolve(ADMIN_ROLE)),
      });

      await expect(
        service.updateRole(CUSTOM_ROLE.id, { name: 'administrador' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('permite guardar el mismo nombre que ya tenía', async () => {
      const { service } = buildService({
        findRoleByName: jest.fn(() => Promise.resolve(CUSTOM_ROLE)),
      });

      await expect(
        service.updateRole(CUSTOM_ROLE.id, { name: 'coordinador' }),
      ).resolves.toBeDefined();
    });
  });

  describe('updateRoleAccess', () => {
    it('persiste el antes y el después junto al motivo', async () => {
      const { service, changes } = buildService();

      await service.updateRoleAccess(
        CUSTOM_ROLE.id,
        {
          modules: [APP_MODULES.TICKETS, APP_MODULES.USERS],
          permissions: [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.USERS_VIEW],
          reason: 'Asume la gestión de usuarios',
        },
        'user-1',
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        roleId: CUSTOM_ROLE.id,
        userId: 'user-1',
        reason: 'Asume la gestión de usuarios',
        previous: { modules: [APP_MODULES.TICKETS], permissions: [PERMISSIONS.TICKETS_VIEW] },
        next: {
          modules: [APP_MODULES.TICKETS, APP_MODULES.USERS],
          permissions: [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.USERS_VIEW],
        },
      });
    });

    it('descarta módulos y permisos que no existen en el catálogo', async () => {
      const { service, changes } = buildService();

      await service.updateRoleAccess(
        CUSTOM_ROLE.id,
        {
          modules: [APP_MODULES.TICKETS, 'modulo-inventado'],
          permissions: [PERMISSIONS.TICKETS_VIEW, 'permiso.inventado'],
          reason: 'Prueba',
        },
        'user-1',
      );

      expect(changes[0]?.next).toEqual({
        modules: [APP_MODULES.TICKETS],
        permissions: [PERMISSIONS.TICKETS_VIEW],
      });
    });

    it('deja rastro también en el historial transversal', async () => {
      const { service, recorded } = buildService();

      await service.updateRoleAccess(
        CUSTOM_ROLE.id,
        { modules: [], permissions: [], reason: 'Se retira todo el acceso' },
        'user-1',
      );

      expect(recorded).toHaveLength(1);
      expect(recorded[0]).toMatchObject({
        module: APP_MODULES.SECURITY,
        entityId: CUSTOM_ROLE.id,
        metadata: { reason: 'Se retira todo el acceso' },
      });
    });

    it('no permite quitar Seguridad a un rol del sistema', async () => {
      // Nadie podría devolvérselo: es un cambio sin vuelta atrás.
      const { service } = buildService();

      await expect(
        service.updateRoleAccess(
          ADMIN_ROLE.id,
          {
            modules: [APP_MODULES.TICKETS],
            permissions: [],
            reason: 'Intento de quitarme el acceso',
          },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite quitar Seguridad a un rol que no es del sistema', async () => {
      const withSecurity: RoleSummary = {
        ...CUSTOM_ROLE,
        modules: [APP_MODULES.SECURITY, APP_MODULES.TICKETS],
      };
      const { service, changes } = buildService({
        findRoleById: jest.fn(() => Promise.resolve(withSecurity)),
        findRoleAccess: jest.fn(() =>
          Promise.resolve({
            modules: withSecurity.modules,
            permissions: withSecurity.permissions,
          }),
        ),
      });

      await service.updateRoleAccess(
        withSecurity.id,
        { modules: [APP_MODULES.TICKETS], permissions: [], reason: 'Ya no administra accesos' },
        'user-1',
      );

      expect(changes[0]?.next.modules).toEqual([APP_MODULES.TICKETS]);
    });

    it('falla si el rol no existe', async () => {
      const { service } = buildService();

      await expect(
        service.updateRoleAccess(
          'desconocido',
          { modules: [], permissions: [], reason: 'Prueba' },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    describe('rol de acceso total', () => {
      const FULL_ACCESS_ROLE: RoleSummary = { ...ADMIN_ROLE, hasFullAccess: true };

      function buildWithFullAccess() {
        return buildService({
          findRoleById: jest.fn(() => Promise.resolve(FULL_ACCESS_ROLE)),
        });
      }

      it('no se puede recortar', async () => {
        // Es la garantía de que la administración no se queda fuera: su acceso
        // se calcula desde el catálogo, así que editarlo no tendría efecto.
        const { service } = buildWithFullAccess();

        await expect(
          service.updateRoleAccess(
            FULL_ACCESS_ROLE.id,
            { modules: [], permissions: [], reason: 'Intento de recortarlo' },
            'user-1',
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('no guarda nada al rechazarlo', async () => {
        const { service, changes } = buildWithFullAccess();

        await service
          .updateRoleAccess(
            FULL_ACCESS_ROLE.id,
            { modules: [], permissions: [], reason: 'Intento' },
            'user-1',
          )
          .catch(() => undefined);

        expect(changes).toHaveLength(0);
      });

      it('tampoco se puede desactivar', async () => {
        const { service } = buildWithFullAccess();

        await expect(
          service.updateRole(FULL_ACCESS_ROLE.id, { isActive: false }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('sí se puede renombrar y describir', async () => {
        // Cambiar cómo se llama no cambia lo que concede.
        const { service } = buildWithFullAccess();

        await expect(
          service.updateRole(FULL_ACCESS_ROLE.id, { description: 'Acceso total' }),
        ).resolves.toBeDefined();
      });
    });
  });

  describe('listAccessAudit', () => {
    it('falla si el rol no existe en lugar de devolver una lista vacía', async () => {
      // Una lista vacía se leería como "sin cambios" y ocultaría el error.
      const { service } = buildService();

      await expect(service.listAccessAudit('desconocido')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('devuelve el historial del rol', async () => {
      const { service, repository } = buildService();

      await service.listAccessAudit(CUSTOM_ROLE.id);

      expect(repository.listAccessAudit).toHaveBeenCalledWith(CUSTOM_ROLE.id);
    });
  });
});
