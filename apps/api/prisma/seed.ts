/**
 * Carga inicial de la base de datos.
 *
 * Crea el catálogo de permisos, los roles del sistema y un usuario
 * administrador. Es idempotente: puede ejecutarse varias veces sin duplicar
 * datos ni sobrescribir la contraseña de un administrador ya existente.
 */
import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ALL_APP_MODULES,
  ALL_PERMISSIONS,
  APP_MODULES,
  PERMISSIONS,
  SYSTEM_ROLES,
  getPermissionModule,
  type AppModule,
  type Permission,
} from '@redsis/contracts';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL es obligatoria para cargar los datos iniciales');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ADMIN_EMAIL = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@redsis.com';
const ADMIN_PASSWORD = process.env['SEED_ADMIN_PASSWORD'] ?? 'Redsis2026';
const ADMIN_NAME = process.env['SEED_ADMIN_NAME'] ?? 'Administrador';

/**
 * Permisos que recibe cada rol del sistema.
 *
 * El administrador se marca además con `hasFullAccess`: su acceso se calcula a
 * partir del catálogo en lugar de leerse de estas tablas. Se le siguen guardando
 * las filas para que la base de datos sea coherente al mirarla, pero la garantía
 * de que lo ve todo no depende de ellas.
 */
const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  [SYSTEM_ROLES.ADMINISTRATOR]: ALL_PERMISSIONS,
  [SYSTEM_ROLES.SUPERVISOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.USERS_VIEW,
    // Roles y Permisos son administración de accesos: solo el administrador.
    // Se consigue quitando el permiso, no comprobando el rol: la autorización
    // nunca se basa en el cargo (ver AGENTS.md).
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_EDIT,
    PERMISSIONS.MAPS_VIEW,
    PERMISSIONS.ACTIVITY_LOGS_VIEW,
  ],
  [SYSTEM_ROLES.TECHNICIAN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_EDIT,
    PERMISSIONS.MAPS_VIEW,
  ],
};

/**
 * Módulos a los que entra cada rol del sistema.
 *
 * El acceso al módulo es la primera puerta: sin él, los permisos del módulo no
 * se evalúan. Por eso el supervisor no recibe Seguridad aunque el catálogo lo
 * declare, y no hace falta comprobar su cargo en ningún sitio.
 */
const ROLE_MODULES: Record<string, readonly AppModule[]> = {
  [SYSTEM_ROLES.ADMINISTRATOR]: ALL_APP_MODULES,
  [SYSTEM_ROLES.SUPERVISOR]: [
    APP_MODULES.DASHBOARD,
    APP_MODULES.TICKETS,
    APP_MODULES.USERS,
    APP_MODULES.MAPS,
  ],
  [SYSTEM_ROLES.TECHNICIAN]: [APP_MODULES.DASHBOARD, APP_MODULES.TICKETS, APP_MODULES.MAPS],
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  [SYSTEM_ROLES.ADMINISTRATOR]: 'Acceso total a la plataforma',
  [SYSTEM_ROLES.SUPERVISOR]: 'Supervisa la operación y consulta indicadores',
  [SYSTEM_ROLES.TECHNICIAN]: 'Atiende servicios en campo',
};

async function seedPermissions(): Promise<Map<Permission, string>> {
  for (const code of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { module: getPermissionModule(code) },
      create: { code, module: getPermissionModule(code) },
    });
  }

  const stored = await prisma.permission.findMany({ select: { id: true, code: true } });
  console.log(`  permisos: ${stored.length}`);

  return new Map(stored.map((permission) => [permission.code as Permission, permission.id]));
}

async function seedRoles(permissionIds: Map<Permission, string>): Promise<Map<string, string>> {
  const roleIds = new Map<string, string>();

  for (const [name, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        description: ROLE_DESCRIPTIONS[name] ?? null,
        isSystem: true,
        isActive: true,
        hasFullAccess: name === SYSTEM_ROLES.ADMINISTRATOR,
      },
      create: {
        name,
        description: ROLE_DESCRIPTIONS[name] ?? null,
        isSystem: true,
        hasFullAccess: name === SYSTEM_ROLES.ADMINISTRATOR,
      },
      select: { id: true },
    });

    // Se reemplaza el conjunto completo para que el rol refleje exactamente
    // lo declarado arriba, incluso si antes tenía permisos que ya no aplican.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions
        .map((code) => permissionIds.get(code))
        .filter((id): id is string => id !== undefined)
        .map((permissionId) => ({ roleId: role.id, permissionId })),
    });

    const modules = ROLE_MODULES[name] ?? [];

    await prisma.roleModule.deleteMany({ where: { roleId: role.id } });
    await prisma.roleModule.createMany({
      data: modules.map((module) => ({ roleId: role.id, module })),
    });

    roleIds.set(name, role.id);
    console.log(`  rol ${name}: ${modules.length} módulos, ${permissions.length} permisos`);
  }

  return roleIds;
}

async function seedAdmin(administratorRoleId: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });

  if (existing) {
    // No se sobrescribe la contraseña de una cuenta existente.
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: existing.id, roleId: administratorRoleId } },
      update: {},
      create: { userId: existing.id, roleId: administratorRoleId },
    });
    console.log(`  administrador existente: ${ADMIN_EMAIL} (contraseña sin cambios)`);
    return;
  }

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      fullName: ADMIN_NAME,
      passwordHash: await hash(ADMIN_PASSWORD, 12),
      roles: { create: { roleId: administratorRoleId } },
    },
  });

  console.log(`  administrador creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

async function main(): Promise<void> {
  console.log('Cargando datos iniciales...');

  const permissionIds = await seedPermissions();
  const roleIds = await seedRoles(permissionIds);

  const administratorRoleId = roleIds.get(SYSTEM_ROLES.ADMINISTRATOR);

  if (!administratorRoleId) {
    throw new Error('No se pudo crear el rol de administrador');
  }

  await seedAdmin(administratorRoleId);

  console.log('Datos iniciales cargados.');
}

main()
  .catch((error: unknown) => {
    console.error('Falló la carga de datos iniciales:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
