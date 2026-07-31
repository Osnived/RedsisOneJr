import {
  findAppModule,
  moduleOfPermission,
  permissionActionLabel,
  type AppModule,
  type Permission,
  type PermissionSummary,
} from '@redsis/contracts';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { cn } from '@/shared/lib/utils';

interface PermissionGroupsProps {
  catalog: readonly PermissionSummary[];
  grantedModules: AppModule[];
  grantedPermissions: Permission[];
  onToggle: (permission: Permission, isGranted: boolean) => void;
  disabled: boolean;
}

/**
 * Permisos por acción, agrupados por módulo.
 *
 * No es una tabla a propósito: lo que se mira aquí es "qué puede hacer este rol
 * en Tickets", y una tabla obligaría a recorrer filas para reconstruir esa
 * respuesta.
 *
 * Los grupos se derivan del catálogo, así que un permiso nuevo aparece en su
 * módulo sin tocar esta pantalla. Un permiso cuyo módulo nadie declaró no se
 * dibuja: colocarlo por descarte en un grupo cualquiera engañaría a quien
 * configura.
 */
export function PermissionGroups({
  catalog,
  grantedModules,
  grantedPermissions,
  onToggle,
  disabled,
}: PermissionGroupsProps): React.JSX.Element {
  const groups = groupByModule(catalog);
  const grantedModuleSet = new Set(grantedModules);
  const grantedSet = new Set(grantedPermissions);

  return (
    <section aria-labelledby="permisos-por-accion" className="flex flex-col gap-3">
      <div>
        <h3 id="permisos-por-accion" className="text-sm font-medium">
          Permisos por acción
        </h3>
        <p className="text-xs text-muted-foreground">
          Qué puede hacer el rol dentro de cada módulo. Marcar una acción concede también el acceso
          al módulo.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay permisos en el catálogo.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li
              key={group.module}
              className={cn(
                'rounded-md border border-border p-3',
                // Un grupo cuyo módulo está cerrado se atenúa: sus permisos no
                // conceden nada mientras la puerta siga cerrada.
                grantedModuleSet.has(group.module) ? undefined : 'opacity-60',
              )}
            >
              <p className="mb-2 text-sm font-medium">
                {findAppModule(group.module)?.label ?? group.module}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                    title={permission.code}
                  >
                    <Checkbox
                      name={permission.code}
                      checked={grantedSet.has(permission.code)}
                      disabled={disabled}
                      onChange={(event) => onToggle(permission.code, event.target.checked)}
                    />
                    {permissionActionLabel(permission.code)}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface PermissionGroup {
  module: AppModule;
  permissions: PermissionSummary[];
}

function groupByModule(catalog: readonly PermissionSummary[]): PermissionGroup[] {
  const groups = new Map<AppModule, PermissionSummary[]>();

  for (const permission of catalog) {
    const module = moduleOfPermission(permission.code);

    if (module === null) {
      continue;
    }

    const bucket = groups.get(module);

    if (bucket) {
      bucket.push(permission);
    } else {
      groups.set(module, [permission]);
    }
  }

  return [...groups.entries()].map(([module, permissions]) => ({ module, permissions }));
}
