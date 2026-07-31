import { Ban, CheckCircle2, Pencil } from 'lucide-react';
import { PERMISSIONS, type Permission, type UserSummary } from '@redsis/contracts';
import type { RowAction } from '@/shared/components/table';

interface BuildUserActionsOptions {
  can: (permission: Permission) => boolean;
  /** Identificador de quien está usando la aplicación. */
  currentUserId: string | undefined;
  onEdit: (user: UserSummary) => void;
  onSetActive: (user: UserSummary, isActive: boolean) => void;
}

/**
 * Acciones disponibles sobre un usuario.
 *
 * Vive en la feature y no en el framework: qué significa suspender y quién puede
 * hacerlo es conocimiento del dominio. El DataTable solo las dibuja.
 *
 * No se ofrece eliminar: los usuarios se suspenden para conservar la trazabilidad
 * de su actividad.
 */
export function buildUserActions({
  can,
  currentUserId,
  onEdit,
  onSetActive,
}: BuildUserActionsOptions): RowAction<UserSummary>[] {
  const canEdit = can(PERMISSIONS.USERS_EDIT);

  return [
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onSelect: onEdit,
      isHidden: () => !canEdit,
    },
    {
      id: 'activate',
      label: 'Activar',
      icon: CheckCircle2,
      onSelect: (user) => onSetActive(user, true),
      // Solo aparece si hay algo que activar.
      isHidden: (user) => !canEdit || user.isActive,
    },
    {
      id: 'suspend',
      label: 'Suspender',
      icon: Ban,
      destructive: true,
      separatorBefore: true,
      onSelect: (user) => onSetActive(user, false),
      isHidden: (user) => !canEdit || !user.isActive,
      // Suspenderse a uno mismo dejaría la cuenta inaccesible sin que nadie más
      // pueda revertirlo; el backend también lo rechaza.
      isDisabled: (user) => user.id === currentUserId,
    },
  ];
}
