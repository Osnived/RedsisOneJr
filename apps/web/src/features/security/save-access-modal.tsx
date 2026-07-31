import { useState } from 'react';
import {
  ACCESS_CHANGE_REASON_MAX,
  findAppModule,
  moduleOfPermission,
  permissionActionLabel,
  type Permission,
} from '@redsis/contracts';
import { EntityModal } from '@/shared/components/form/entity-modal';
import { FormField } from '@/shared/components/form/form-field';
import { FormFooter } from '@/shared/components/form/form-footer';
import { Alert } from '@/shared/components/ui/alert';
import { cn } from '@/shared/lib/utils';
import type { AccessDiff } from './access-draft';

interface SaveAccessModalProps {
  isOpen: boolean;
  roleName: string;
  diff: AccessDiff;
  isSaving: boolean;
  error: Error | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Confirmación de un cambio de accesos.
 *
 * Guardar no ocurre al pulsar el botón: primero hay que explicar por qué. El
 * motivo es obligatorio porque una auditoría sin motivos registra qué cambió y
 * no sirve para responder por qué, que es la pregunta que se hace después.
 *
 * Se muestra lo que va a cambiar junto al campo: quien firma el motivo tiene que
 * ver exactamente lo que firma.
 */
export function SaveAccessModal({
  isOpen,
  roleName,
  diff,
  isSaving,
  error,
  onClose,
  onConfirm,
}: SaveAccessModalProps): React.JSX.Element {
  const [reason, setReason] = useState('');

  const trimmedReason = reason.trim();
  const isEmpty = trimmedReason.length === 0;

  function close(): void {
    setReason('');
    onClose();
  }

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={close}
      title="Guardar cambios"
      description={`Se modificará el acceso del rol ${roleName}.`}
      isBlocked={isSaving}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();

          if (!isEmpty) {
            onConfirm(trimmedReason);
          }
        }}
      >
        <AccessDiffSummary diff={diff} />

        {error ? <Alert variant="destructive">{error.message}</Alert> : null}

        <FormField
          name="motivo"
          label="Motivo del cambio"
          required
          hint="Queda registrado en el historial del rol y no se puede editar después."
          error={isEmpty && reason.length > 0 ? 'El motivo del cambio es obligatorio' : undefined}
        >
          <textarea
            id="motivo"
            name="motivo"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={ACCESS_CHANGE_REASON_MAX}
            aria-invalid={isEmpty && reason.length > 0}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm aria-invalid:border-destructive"
          />
        </FormField>

        <FormFooter
          onCancel={close}
          isSubmitting={isSaving}
          isSubmitDisabled={isEmpty}
          submitLabel="Guardar cambios"
        />
      </form>
    </EntityModal>
  );
}

/** Lo que va a cambiar, en el idioma del usuario y no en códigos. */
function AccessDiffSummary({ diff }: { diff: AccessDiff }): React.JSX.Element {
  return (
    <dl className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
      <DiffRow label="Módulos que gana" values={diff.addedModules.map(moduleLabel)} tone="added" />
      <DiffRow
        label="Módulos que pierde"
        values={diff.removedModules.map(moduleLabel)}
        tone="removed"
      />
      <DiffRow
        label="Permisos que gana"
        values={diff.addedPermissions.map(permissionLabel)}
        tone="added"
      />
      <DiffRow
        label="Permisos que pierde"
        values={diff.removedPermissions.map(permissionLabel)}
        tone="removed"
      />
    </dl>
  );
}

function DiffRow({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: 'added' | 'removed';
}): React.JSX.Element | null {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', tone === 'added' ? 'text-emerald-700' : 'text-destructive')}>
        {values.join(', ')}
      </dd>
    </div>
  );
}

function moduleLabel(module: string): string {
  return findAppModule(module)?.label ?? module;
}

/** "Seguridad · Editar" se entiende; "roles.edit" hay que traducirlo mentalmente. */
function permissionLabel(permission: Permission): string {
  const module = moduleOfPermission(permission);
  const label = module === null ? permission : (findAppModule(module)?.label ?? module);

  return `${label} · ${permissionActionLabel(permission)}`;
}
