import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { RoleSummary } from '@redsis/contracts';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Spinner } from '@/shared/components/ui/spinner';
import { cn } from '@/shared/lib/utils';

interface RoleListProps {
  roles: RoleSummary[];
  loading: boolean;
  selectedRoleId: string | null;
  onSelect: (roleId: string) => void;
  onCreate: () => void;
  canCreate: boolean;
}

/**
 * Panel izquierdo: los roles de la plataforma.
 *
 * Seleccionar un rol no recarga nada, solo cambia qué se administra a la
 * derecha: la lista y el detalle comparten la misma consulta.
 *
 * Los roles no se eliminan. Un rol desactivado sigue aquí, marcado, porque
 * conserva su configuración y puede volver a activarse.
 */
export function RoleList({
  roles,
  loading,
  selectedRoleId,
  onSelect,
  onCreate,
  canCreate,
}: RoleListProps): React.JSX.Element {
  const [search, setSearch] = useState('');

  const matching = useMemo(() => filterRoles(roles, search), [roles, search]);

  return (
    <section aria-labelledby="lista-de-roles" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="lista-de-roles" className="text-sm font-medium">
          Roles
        </h2>

        {canCreate ? (
          <Button variant="outline" size="sm" onClick={onCreate}>
            <Plus aria-hidden="true" />
            Nuevo rol
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar rol"
          aria-label="Buscar rol"
          className="h-9 pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <RoleItems
          roles={matching}
          selectedRoleId={selectedRoleId}
          onSelect={onSelect}
          isFiltered={search.trim().length > 0}
        />
      )}
    </section>
  );
}

function RoleItems({
  roles,
  selectedRoleId,
  onSelect,
  isFiltered,
}: {
  roles: RoleSummary[];
  selectedRoleId: string | null;
  onSelect: (roleId: string) => void;
  isFiltered: boolean;
}): React.JSX.Element {
  if (roles.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {isFiltered ? 'Ningún rol coincide' : 'Todavía no hay roles'}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {roles.map((role) => (
        <li key={role.id}>
          <button
            type="button"
            onClick={() => onSelect(role.id)}
            aria-current={role.id === selectedRoleId ? 'true' : undefined}
            className={cn(
              'flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left',
              role.id === selectedRoleId
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:bg-accent',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{role.name}</span>
              {role.isSystem ? <Badge variant="neutral">Del sistema</Badge> : null}
              {role.isActive ? null : <Badge variant="danger">Desactivado</Badge>}
            </span>

            <span className="text-xs text-muted-foreground">{describeAccess(role)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Resumen del alcance del rol. Evita abrirlo para saber si está configurado. */
function describeAccess(role: RoleSummary): string {
  const modules = role.modules.length === 1 ? '1 módulo' : `${role.modules.length} módulos`;
  const permissions =
    role.permissions.length === 1 ? '1 permiso' : `${role.permissions.length} permisos`;
  const users = role.userCount === 1 ? '1 usuario' : `${role.userCount} usuarios`;

  return `${modules} · ${permissions} · ${users}`;
}

/**
 * Filtra por nombre y por descripción.
 *
 * Se busca también en la descripción porque quien no recuerda el nombre exacto
 * suele recordar para qué servía el rol.
 */
function filterRoles(roles: RoleSummary[], search: string): RoleSummary[] {
  const term = search.trim().toLocaleLowerCase('es');

  if (term.length === 0) {
    return roles;
  }

  return roles.filter((role) =>
    `${role.name} ${role.description ?? ''}`.toLocaleLowerCase('es').includes(term),
  );
}
