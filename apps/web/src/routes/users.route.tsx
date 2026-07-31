import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { PERMISSIONS, type UserSummary } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { DataTable, RowActions } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getUserRowId, userColumns } from '@/features/users/columns/user.columns';
import { buildUserActions } from '@/features/users/user-actions';
import { UserForm } from '@/features/users/user-form';
import {
  toCreateUserInput,
  toUpdateUserInput,
  type UserFormValues,
} from '@/features/users/user-form.schema';
import { useUsers } from '@/features/users/use-users';
import {
  useCreateUser,
  useSetUserActive,
  useUpdateUser,
} from '@/features/users/use-user-mutations';
import { useRoles } from '@/features/roles/use-roles';
import { Forbidden } from '@/shared/components/layout/forbidden';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { useAuthStore } from '@/stores/auth.store';
import { authenticatedRoute } from './authenticated.route';

const PAGE_SIZE = 25;

export const usersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/users',
  component: UsersPage,
});

/** Estado del modal: cerrado, creando, o editando a alguien concreto. */
type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; user: UserSummary };

/**
 * Pantalla de Usuarios: primer CRUD completo de la plataforma.
 *
 * La página orquesta; no contiene reglas. Las acciones de fila las declara la
 * feature, la validación vive en su esquema y el formulario reutiliza la
 * infraestructura compartida.
 */
function UsersPage(): React.JSX.Element {
  const auth = useAuthorization();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [formState, setFormState] = useState<FormState>({ mode: 'closed' });

  const usersQuery = useUsers(1, PAGE_SIZE);
  // El selector de rol necesita el catálogo de roles.
  const rolesQuery = useRoles();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const setUserActive = useSetUserActive();

  if (!auth.can(PERMISSIONS.USERS_VIEW)) {
    return <Forbidden detail="No tienes permiso para consultar usuarios." />;
  }

  const closeForm = (): void => {
    setFormState({ mode: 'closed' });
    createUser.reset();
    updateUser.reset();
  };

  const submitForm = (values: UserFormValues): void => {
    if (formState.mode === 'create' && values.password) {
      createUser.mutate(toCreateUserInput({ ...values, password: values.password }), {
        onSuccess: closeForm,
      });
      return;
    }

    if (formState.mode === 'edit') {
      updateUser.mutate(
        { id: formState.user.id, input: toUpdateUserInput(values) },
        { onSuccess: closeForm },
      );
    }
  };

  const actions = buildUserActions({
    can: auth.can,
    currentUserId,
    onEdit: (user) => setFormState({ mode: 'edit', user }),
    onSetActive: (user, isActive) => setUserActive.mutate({ id: user.id, isActive }),
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {usersQuery.isPending ? 'Consultando...' : `${usersQuery.data?.total ?? 0} registrados`}
        </p>
      </header>

      {setUserActive.isError ? (
        <Alert variant="destructive">{setUserActive.error.message}</Alert>
      ) : null}

      <DataTable
        tableId={TABLE_IDS.USERS}
        columns={userColumns}
        data={usersQuery.data?.items ?? []}
        getRowId={getUserRowId}
        loading={usersQuery.isPending}
        error={usersQuery.error}
        searchPlaceholder="Buscar por nombre o correo..."
        emptyMessage="No hay usuarios registrados"
        rowActions={(user) => <RowActions row={user} actions={actions} />}
        toolbar={
          auth.can(PERMISSIONS.USERS_CREATE) ? (
            <Button size="sm" onClick={() => setFormState({ mode: 'create' })}>
              <Plus aria-hidden="true" />
              Nuevo usuario
            </Button>
          ) : null
        }
      />

      {formState.mode === 'closed' ? null : (
        <UserForm
          isOpen
          onClose={closeForm}
          {...(formState.mode === 'edit' ? { user: formState.user } : {})}
          roles={rolesQuery.data ?? []}
          onSubmit={submitForm}
          isSubmitting={createUser.isPending || updateUser.isPending}
          error={createUser.error ?? updateUser.error}
        />
      )}
    </div>
  );
}
