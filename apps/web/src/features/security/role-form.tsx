import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { createRoleSchema, type CreateRoleInput, type RoleSummary } from '@redsis/contracts';
import {
  EntityForm,
  EntityModal,
  FormField,
  fieldAccessibilityProps,
} from '@/shared/components/form';
import { Input } from '@/shared/components/ui/input';

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ausente al crear, presente al editar. */
  role?: RoleSummary | undefined;
  onSubmit: (values: CreateRoleInput) => void;
  isSubmitting: boolean;
  error?: Error | null;
}

/**
 * Alta y edición de un rol.
 *
 * Solo el nombre y la descripción: los accesos se administran en el panel
 * derecho, con su motivo y su auditoría. Un rol nuevo nace sin accesos, y eso es
 * deliberado — se concede lo que hace falta, no se parte de todo.
 *
 * Reutiliza la infraestructura compartida de formularios y valida con el mismo
 * esquema Zod que exige el backend.
 */
export function RoleForm({
  isOpen,
  onClose,
  role,
  onSubmit,
  isSubmitting,
  error = null,
}: RoleFormProps): React.JSX.Element {
  const isEditing = role !== undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: standardSchemaResolver(createRoleSchema),
    values: {
      name: role?.name ?? '',
      description: role?.description ?? '',
    },
  });

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar rol' : 'Nuevo rol'}
      description={
        isEditing
          ? 'Cambia el nombre o la descripción. Los accesos se administran aparte.'
          : 'El rol se crea sin accesos: se conceden después, con su motivo.'
      }
      isBlocked={isSubmitting}
    >
      <EntityForm
        onSubmit={handleSubmit((values) => onSubmit(values))}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel={isEditing ? 'Guardar' : 'Crear rol'}
      >
        <FormField name="name" label="Nombre" required error={errors.name?.message}>
          <Input
            {...register('name')}
            {...fieldAccessibilityProps({ name: 'name', error: errors.name?.message })}
            placeholder="coordinador"
          />
        </FormField>

        <FormField
          name="description"
          label="Descripción"
          error={errors.description?.message}
          hint="Para qué sirve este rol. Ayuda a no crear dos parecidos."
        >
          <Input
            {...register('description')}
            {...fieldAccessibilityProps({
              name: 'description',
              error: errors.description?.message,
              hint: 'Para qué sirve este rol. Ayuda a no crear dos parecidos.',
            })}
            placeholder="Coordina la operación de una zona"
          />
        </FormField>
      </EntityForm>
    </EntityModal>
  );
}
