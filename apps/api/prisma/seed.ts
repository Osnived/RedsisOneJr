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
  ALL_PERMISSIONS,
  PERMISSIONS,
  SYSTEM_ROLES,
  getPermissionModule,
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

/** Permisos que recibe cada rol del sistema. El administrador recibe todos. */
const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  [SYSTEM_ROLES.ADMINISTRATOR]: ALL_PERMISSIONS,
  [SYSTEM_ROLES.SUPERVISOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ROLES_VIEW,
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
      update: { description: ROLE_DESCRIPTIONS[name] ?? null, isSystem: true },
      create: { name, description: ROLE_DESCRIPTIONS[name] ?? null, isSystem: true },
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

    roleIds.set(name, role.id);
    console.log(`  rol ${name}: ${permissions.length} permisos`);
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
