import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  addTicketObservationSchema,
  assignTechnicianSchema,
  changeTicketPrioritySchema,
  type AddTicketObservationInput,
  type AssignTechnicianInput,
  type ChangeTicketPriorityInput,
  type TicketPriority,
} from '@redsis/contracts';
import {
  EntityForm,
  EntityModal,
  FormField,
  fieldAccessibilityProps,
} from '@/shared/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';

/**
 * Formularios de las acciones del coordinador.
 *
 * Los tres reutilizan por completo la infraestructura compartida —modal, cuerpo,
 * pie de acciones y envoltorio de campo— y solo aportan qué se pide y cómo se
 * valida. La validación es el esquema del contrato compartido, así que la pantalla
 * y el origen de datos no pueden discrepar sobre qué es válido.
 *
 * Ninguno decide nada: reciben un `onSubmit` y lo invocan. Qué ocurre después es
 * asunto del origen de datos.
 */

interface ActionFormProps<TValues> {
  onClose: () => void;
  onSubmit: (values: TValues) => void;
  isSubmitting: boolean;
  error?: Error | null;
}

export function AssignTechnicianForm({
  technicians,
  currentTechnician,
  onClose,
  onSubmit,
  isSubmitting,
  error = null,
}: ActionFormProps<AssignTechnicianInput> & {
  technicians: string[];
  currentTechnician: string | null;
}): React.JSX.Element {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssignTechnicianInput>({
    resolver: standardSchemaResolver(assignTechnicianSchema),
    defaultValues: { technicianName: currentTechnician ?? '' },
  });

  const selected = watch('technicianName');

  return (
    <EntityModal
      isOpen
      onClose={onClose}
      title="Asignar técnico"
      description="Quien atienda el servicio en la sucursal."
      isBlocked={isSubmitting}
    >
      <EntityForm
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel="Asignar"
      >
        <FormField
          name="technicianName"
          label="Técnico"
          error={errors.technicianName?.message}
          required
        >
          <Select
            value={selected}
            onValueChange={(value) => setValue('technicianName', value, { shouldValidate: true })}
          >
            <SelectTrigger
              {...fieldAccessibilityProps({
                name: 'technicianName',
                error: errors.technicianName?.message,
              })}
            >
              <SelectValue placeholder="Selecciona un técnico" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((technician) => (
                <SelectItem key={technician} value={technician}>
                  {technician}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </EntityForm>
    </EntityModal>
  );
}

const PRIORITY_OPTIONS: TicketPriority[] = [
  TICKET_PRIORITIES.LOW,
  TICKET_PRIORITIES.MEDIUM,
  TICKET_PRIORITIES.HIGH,
  TICKET_PRIORITIES.CRITICAL,
];

export function ChangePriorityForm({
  currentPriority,
  onClose,
  onSubmit,
  isSubmitting,
  error = null,
}: ActionFormProps<ChangeTicketPriorityInput> & {
  currentPriority: TicketPriority;
}): React.JSX.Element {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChangeTicketPriorityInput>({
    resolver: standardSchemaResolver(changeTicketPrioritySchema),
    defaultValues: { priority: currentPriority },
  });

  const selected = watch('priority');

  return (
    <EntityModal
      isOpen
      onClose={onClose}
      title="Cambiar prioridad"
      description="Queda registrado en la auditoría del ticket."
      isBlocked={isSubmitting}
    >
      <EntityForm
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel="Cambiar prioridad"
      >
        <FormField name="priority" label="Prioridad" error={errors.priority?.message} required>
          <Select
            value={selected}
            onValueChange={(value) => {
              // Se busca la opción en lugar de afirmar el tipo: lo que devuelve el
              // desplegable es texto, y afirmar que es una prioridad sería confiar
              // en que nadie añada una opción que no lo sea.
              const priority = PRIORITY_OPTIONS.find((option) => option === value);

              if (priority !== undefined) {
                setValue('priority', priority, { shouldValidate: true });
              }
            }}
          >
            <SelectTrigger
              {...fieldAccessibilityProps({ name: 'priority', error: errors.priority?.message })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {TICKET_PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </EntityForm>
    </EntityModal>
  );
}

const NOTE_HINT = 'Lo que haga falta saber sobre el servicio. No cambia ningún dato del ticket.';

export function AddObservationForm({
  onClose,
  onSubmit,
  isSubmitting,
  error = null,
}: ActionFormProps<AddTicketObservationInput>): React.JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTicketObservationInput>({
    resolver: standardSchemaResolver(addTicketObservationSchema),
    defaultValues: { note: '' },
  });

  return (
    <EntityModal
      isOpen
      onClose={onClose}
      title="Agregar observación"
      description="Aparece en el timeline del servicio."
      isBlocked={isSubmitting}
    >
      <EntityForm
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel="Agregar"
      >
        <FormField
          name="note"
          label="Observación"
          error={errors.note?.message}
          hint={NOTE_HINT}
          required
        >
          <Textarea
            {...fieldAccessibilityProps({
              name: 'note',
              error: errors.note?.message,
              hint: NOTE_HINT,
            })}
            {...register('note')}
          />
        </FormField>
      </EntityForm>
    </EntityModal>
  );
}
