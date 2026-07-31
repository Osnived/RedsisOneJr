import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS, type RoleSummary } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Spinner } from '@/shared/components/ui/spinner';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { AccessHistory } from '@/features/security/access-history';
import { RoleAccessPanel } from '@/features/security/role-access-panel';
import { RoleForm } from '@/features/security/role-form';
import { RoleList } from '@/features/security/role-list';
import {
  useCreateRole,
  useSetRoleActive,
  useUpdateRole,
  useUpdateRoleAccess,
} from '@/features/security/use-role-mutations';
import { useAccessCatalog, useRoleAudit, useRoles } from '@/features/security/use-security';
import { authenticatedRoute } from './authenticated.route';

export const securityRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/security',
  component: SecurityPage,
});

type FormState = { mode: 'create' } | { mode: 'edit'; role: RoleSummary } | null;

/**
 * Pantalla de Seguridad.
 *
 * Es la única fuente de verdad de la administración de accesos: sustituye por
 * completo a las pantallas de Roles y Permisos.
 *
 * Dos paneles. A la izquierda los roles; a la derecha el acceso completo del rol
 * seleccionado. Cambiar de rol no recarga nada: la lista y el detalle salen de la
 * misma consulta y el panel derecho solo cambia de rol.
 *
 * Diseñada para escritorio, como pide el release. En pantallas estrechas los
 * paneles se apilan para que siga siendo usable, no para optimizarla.
 */
function SecurityPage(): React.JSX.Element {
  const auth = useAuthorization();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);

  const rolesQuery = useRoles();
  const catalogQuery = useAccessCatalog();

  const roles = rolesQuery.data ?? [];
  // Si nadie ha elegido, se administra el primero: un panel derecho vacío al
  // entrar obligaría a un clic antes de que la pantalla sirviera para algo.
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;

  const auditQuery = useRoleAudit(selectedRole?.id ?? null);

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const setRoleActive = useSetRoleActive();
  const updateAccess = useUpdateRoleAccess();

  const canEdit = auth.can(PERMISSIONS.ROLES_EDIT);

  if (!auth.can(PERMISSIONS.ROLES_VIEW)) {
    return <Alert variant="destructive">No tienes permiso para administrar la seguridad.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Seguridad</h1>
        <p className="text-sm text-muted-foreground">
          Roles, acceso a módulos y permisos por acción. Todo cambio queda registrado con su motivo.
        </p>
      </header>

      {rolesQuery.error ? <Alert variant="destructive">{rolesQuery.error.message}</Alert> : null}
      {catalogQuery.error ? (
        <Alert variant="destructive">{catalogQuery.error.message}</Alert>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-[35%] lg:shrink-0">
          <RoleList
            roles={roles}
            loading={rolesQuery.isPending}
            selectedRoleId={selectedRole?.id ?? null}
            onSelect={setSelectedRoleId}
            onCreate={() => setFormState({ mode: 'create' })}
            canCreate={auth.can(PERMISSIONS.ROLES_CREATE)}
          />
        </div>

        <div className="min-w-0 flex-1 lg:border-l lg:border-border lg:pl-6">
          {renderAccessPanel()}
        </div>
      </div>

      <RoleForm
        isOpen={formState !== null}
        onClose={() => setFormState(null)}
        {...(formState?.mode === 'edit' ? { role: formState.role } : {})}
        isSubmitting={createRole.isPending || updateRole.isPending}
        error={createRole.error ?? updateRole.error}
        onSubmit={(values) => {
          if (formState?.mode === 'edit') {
            updateRole.mutate(
              { id: formState.role.id, input: values },
              { onSuccess: () => setFormState(null) },
            );
            return;
          }

          createRole.mutate(values, {
            onSuccess: (role) => {
              // Se selecciona el rol nuevo: acaba de crearse sin accesos y lo
              // siguiente que hay que hacer es concederlos.
              setSelectedRoleId(role.id);
              setFormState(null);
            },
          });
        }}
      />
    </div>
  );

  function renderAccessPanel(): React.JSX.Element {
    if (rolesQuery.isPending || catalogQuery.isPending) {
      return (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      );
    }

    if (selectedRole === null || catalogQuery.data === undefined) {
      return <Alert>Crea un rol para empezar a administrar accesos.</Alert>;
    }

    return (
      <div className="flex flex-col gap-6">
        <RoleAccessPanel
          role={selectedRole}
          catalog={catalogQuery.data}
          canEdit={canEdit}
          isSaving={updateAccess.isPending}
          saveError={updateAccess.error}
          onSave={(draft, reason) =>
            updateAccess.mutate({
              id: selectedRole.id,
              input: { modules: draft.modules, permissions: draft.permissions, reason },
            })
          }
          onEditRole={() => setFormState({ mode: 'edit', role: selectedRole })}
          onToggleActive={(isActive) => setRoleActive.mutate({ id: selectedRole.id, isActive })}
        />

        {auth.can(PERMISSIONS.ACTIVITY_LOGS_VIEW) ? (
          <div className="border-t border-border pt-6">
            <AccessHistory
              entries={auditQuery.data ?? []}
              loading={auditQuery.isPending}
              roleName={selectedRole.name}
            />
          </div>
        ) : null}
      </div>
    );
  }
}
