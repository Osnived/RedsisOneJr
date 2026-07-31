import { useState } from 'react';
import { Pencil, Power, Save } from 'lucide-react';
import type { AccessCatalog, RoleSummary } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  diffAccess,
  draftFromRole,
  hasChanges,
  toggleModule,
  togglePermission,
  type AccessDraft,
} from './access-draft';
import { ModuleAccessBlock } from './module-access-block';
import { PermissionGroups } from './permission-groups';
import { SaveAccessModal } from './save-access-modal';

interface RoleAccessPanelProps {
  role: RoleSummary;
  catalog: AccessCatalog;
  canEdit: boolean;
  isSaving: boolean;
  saveError: Error | null;
  onSave: (draft: AccessDraft, reason: string) => void;
  onEditRole: () => void;
  onToggleActive: (isActive: boolean) => void;
}

/**
 * Panel derecho: el acceso completo del rol seleccionado.
 *
 * Los cambios se acumulan en un borrador local y no se envían al marcar cada
 * casilla. Guardar exige un motivo, así que enviar por casilla haría imposible
 * explicar el cambio como una decisión.
 *
 * El borrador se reinicia al cambiar de rol comparando durante el render, no en
 * un efecto: un efecto pintaría un instante el borrador del rol anterior sobre
 * el rol nuevo.
 */
export function RoleAccessPanel({
  role,
  catalog,
  canEdit,
  isSaving,
  saveError,
  onSave,
  onEditRole,
  onToggleActive,
}: RoleAccessPanelProps): React.JSX.Element {
  const [draft, setDraft] = useState<AccessDraft>(() => draftFromRole(role));
  const [draftRoleId, setDraftRoleId] = useState(role.id);
  const [isConfirming, setIsConfirming] = useState(false);

  if (draftRoleId !== role.id) {
    setDraftRoleId(role.id);
    setDraft(draftFromRole(role));
    setIsConfirming(false);
  }

  const isDirty = hasChanges(draft, role);
  // El acceso de un rol total se calcula desde el catálogo: no hay nada que
  // editar, y permitirlo daría a entender que se puede recortar.
  const isLocked = !canEdit || isSaving || role.hasFullAccess;
  const isEditable = canEdit && !role.hasFullAccess;

  return (
    <section aria-labelledby="acceso-del-rol" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="acceso-del-rol" className="flex items-center gap-2 text-lg font-semibold">
            {role.name}
            {role.isSystem ? <Badge variant="neutral">Del sistema</Badge> : null}
            {role.isActive ? null : <Badge variant="danger">Desactivado</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">{role.description ?? 'Sin descripción'}</p>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEditRole}>
              <Pencil aria-hidden="true" />
              Editar
            </Button>

            {/* Un rol del sistema no se desactiva: dejaría la plataforma sin
                administración y nadie podría devolverle el acceso. */}
            {role.isSystem || role.hasFullAccess ? null : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(!role.isActive)}
                disabled={isSaving}
              >
                <Power aria-hidden="true" />
                {role.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            )}
          </div>
        ) : null}
      </header>

      {role.isActive ? null : (
        <Alert>
          Este rol está desactivado: conserva su configuración y no concede acceso a nadie.
        </Alert>
      )}

      {role.hasFullAccess ? (
        <Alert>
          Este rol tiene acceso total por definición: recibe todos los módulos y todos los permisos
          que existan, incluidos los que se añadan en el futuro. Su acceso no se edita, para que la
          administración de la plataforma no pueda quedarse fuera.
        </Alert>
      ) : null}

      <ModuleAccessBlock
        modules={catalog.modules}
        granted={draft.modules}
        disabled={isLocked}
        onToggle={(module, isGranted) =>
          setDraft((current) => toggleModule(current, module, isGranted, catalog.permissions))
        }
      />

      <PermissionGroups
        catalog={catalog.permissions}
        grantedModules={draft.modules}
        grantedPermissions={draft.permissions}
        disabled={isLocked}
        onToggle={(permission, isGranted) =>
          setDraft((current) => togglePermission(current, permission, isGranted))
        }
      />

      {isEditable ? (
        <footer className="flex items-center justify-end gap-3 border-t border-border pt-4">
          {isDirty ? (
            <p className="text-sm text-muted-foreground">Hay cambios sin guardar.</p>
          ) : null}

          <Button
            variant="outline"
            onClick={() => setDraft(draftFromRole(role))}
            disabled={!isDirty}
          >
            Descartar
          </Button>

          <Button onClick={() => setIsConfirming(true)} disabled={!isDirty}>
            <Save aria-hidden="true" />
            Guardar
          </Button>
        </footer>
      ) : null}

      <SaveAccessModal
        isOpen={isConfirming}
        roleName={role.name}
        diff={diffAccess(draft, role)}
        isSaving={isSaving}
        error={saveError}
        onClose={() => setIsConfirming(false)}
        onConfirm={(reason) => onSave(draft, reason)}
      />
    </section>
  );
}
