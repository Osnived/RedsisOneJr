import { Pencil, Star, Trash2 } from 'lucide-react';
import { PERMISSIONS, type DataSourceSummary, type Permission } from '@redsis/contracts';
import type { RowAction } from '@/shared/components/table';

interface BuildDataSourceActionsOptions {
  can: (permission: Permission) => boolean;
  onEdit: (source: DataSourceSummary) => void;
  onSetDefault: (source: DataSourceSummary) => void;
  onRemove: (source: DataSourceSummary) => void;
}

/**
 * Acciones sobre una fuente de datos.
 *
 * Vive en la feature y no en el framework: qué significa "designar por defecto" y
 * quién puede hacerlo es conocimiento del dominio.
 *
 * Dos acciones se ocultan solas en lugar de fallar al usarse:
 *
 * - **Designar por defecto** no aparece en la que ya lo es ni en una desactivada.
 * - **Retirar** no aparece en la de por defecto: dejaría la pantalla de Tickets sin
 *   saber a quién preguntar. El backend lo rechaza igualmente; ocultarlo evita
 *   ofrecer algo que se va a negar.
 */
export function buildDataSourceActions({
  can,
  onEdit,
  onSetDefault,
  onRemove,
}: BuildDataSourceActionsOptions): RowAction<DataSourceSummary>[] {
  const canEdit = can(PERMISSIONS.DATA_SOURCES_EDIT);
  const canDelete = can(PERMISSIONS.DATA_SOURCES_DELETE);

  return [
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onSelect: onEdit,
      isHidden: () => !canEdit,
    },
    {
      id: 'set-default',
      label: 'Usar por defecto',
      icon: Star,
      onSelect: onSetDefault,
      isHidden: (source) => !canEdit || source.isDefault || !source.isActive,
    },
    {
      id: 'remove',
      label: 'Retirar',
      icon: Trash2,
      destructive: true,
      onSelect: onRemove,
      isHidden: (source) => !canDelete || source.isDefault,
    },
  ];
}
