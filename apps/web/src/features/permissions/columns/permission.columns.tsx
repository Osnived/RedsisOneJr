import type { PermissionSummary } from '@redsis/contracts';
import { Badge } from '@/shared/components/ui/badge';
import { defineColumns } from '@/shared/lib/table/registry';

/**
 * Columnas del catálogo de permisos.
 *
 * El catálogo es de solo lectura: los permisos los define el código y la semilla
 * los inserta. Esta pantalla existe para saber qué accesos son posibles, no para
 * modificarlos.
 */
export const permissionColumns = defineColumns<PermissionSummary>([
  {
    id: 'code',
    header: 'Permiso',
    accessor: (permission) => permission.code,
    // El código es la identidad del permiso: nunca se oculta.
    hideable: false,
    width: 210,
    cell: (permission) => <code className="text-xs">{permission.code}</code>,
  },
  {
    id: 'module',
    header: 'Módulo',
    accessor: (permission) => permission.module,
    width: 160,
    cell: (permission) => <Badge variant="neutral">{permission.module}</Badge>,
  },
  {
    id: 'action',
    header: 'Acción',
    // Se deriva del código para poder agrupar mentalmente por tipo de operación
    // sin necesidad de que el backend lo envíe por separado.
    accessor: (permission) => permission.code.split('.')[1] ?? '',
    width: 140,
  },
  {
    id: 'description',
    header: 'Descripción',
    accessor: (permission) => permission.description,
    width: 280,
  },
]);

export const getPermissionRowId = (permission: PermissionSummary): string => permission.id;
