import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type { RoleSummary, UserSummary } from '@redsis/contracts';
import {
  EntityForm,
  EntityModal,
  FormField,
  fieldAccessibilityProps,
} from '@/shared/components/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  createUserFormSchema,
  splitFullName,
  userFormSchema,
  type UserFormValues,
} from './user-form.schema';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ausente al crear, presente al editar. */
  user?: UserSummary | undefined;
  roles: RoleSummary[];
  onSubmit: (values: UserFormValues) => void;
  isSubmitting: boolean;
  error?: Error | null;
}

/**
 * Formulario de alta y edición de usuario.
 *
 * Reutiliza por completo la infraestructura compartida: el modal, el cuerpo del
 * formulario, el pie de acciones y el envoltorio de campo. Lo único propio del
 * dominio es qué campos existen y cómo se validan.
 *
 * Al editar no se pide contraseña: cambiar la de otra persona es una operación
 * distinta y tendrá su propio flujo.
 */
export function UserForm({
  isOpen,
  onClose,
  user,
  roles,
  onSubmit,
  isSubmitting,
  error = null,
}: UserFormProps): React.JSX.Element {
  const isEditing = user !== undefined;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: standardSchemaResolver(isEditing ? userFormSchema : createUserFormSchema),
    defaultValues: buildDefaultValues(user, roles),
  });

  const selectedRoleId = watch('roleId');
  const isActive = watch('isActive');

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar usuario' : 'Nuevo usuario'}
      description={
        isEditing
          ? 'El correo no puede modificarse: identifica la cuenta.'
          : 'La contraseña es temporal y la persona deberá cambiarla.'
      }
      isBlocked={isSubmitting}
    >
      <EntityForm
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel={isEditing ? 'Guardar cambios' : 'Crear usuario'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="firstName" label="Nombre" error={errors.firstName?.message} required>
            <Input
              {...fieldAccessibilityProps({ name: 'firstName', error: errors.firstName?.message })}
              autoComplete="given-name"
              {...register('firstName')}
            />
          </FormField>

          <FormField name="lastName" label="Apellidos" error={errors.lastName?.message} required>
            <Input
              {...fieldAccessibilityProps({ name: 'lastName', error: errors.lastName?.message })}
              autoComplete="family-name"
              {...register('lastName')}
            />
          </FormField>
        </div>

        <FormField name="email" label="Correo" error={errors.email?.message} required>
          <Input
            {...fieldAccessibilityProps({ name: 'email', error: errors.email?.message })}
            type="email"
            autoComplete="email"
            disabled={isEditing}
            {...register('email')}
          />
        </FormField>

        {isEditing ? null : (
          <FormField
            name="password"
            label="Contraseña temporal"
            error={errors.password?.message}
            hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
            required
          >
            <Input
              {...fieldAccessibilityProps({
                name: 'password',
                error: errors.password?.message,
                hint: 'x',
              })}
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
          </FormField>
        )}

        <FormField name="roleId" label="Rol" error={errors.roleId?.message} required>
          <Select
            value={selectedRoleId}
            onValueChange={(value) => setValue('roleId', value, { shouldValidate: true })}
          >
            <SelectTrigger
              {...fieldAccessibilityProps({ name: 'roleId', error: errors.roleId?.message })}
            >
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <span className="capitalize">{role.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          name="isActive"
          label="Estado"
          error={errors.isActive?.message}
          hint={isActive ? 'Puede iniciar sesión.' : 'No puede iniciar sesión.'}
        >
          <Select
            value={isActive ? 'active' : 'suspended'}
            onValueChange={(value) => setValue('isActive', value === 'active')}
          >
            <SelectTrigger id="isActive">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="suspended">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </EntityForm>
    </EntityModal>
  );
}

function buildDefaultValues(user: UserSummary | undefined, roles: RoleSummary[]): UserFormValues {
  if (!user) {
    return {
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      isActive: true,
      password: '',
    };
  }

  const { firstName, lastName } = splitFullName(user.fullName);
  // El listado entrega los roles por nombre; se traduce al identificador que
  // espera el selector.
  const currentRole = roles.find((role) => user.roles.includes(role.name));

  return {
    firstName,
    lastName,
    email: user.email,
    roleId: currentRole?.id ?? '',
    isActive: user.isActive,
  };
}
