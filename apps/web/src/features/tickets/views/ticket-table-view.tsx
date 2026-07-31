import { Eye } from 'lucide-react';
import { AdvancedTable, RowActions } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getTicketRowId, ticketColumns } from '../columns/ticket.columns';
import type { TicketViewProps } from './ticket-view.types';

/**
 * Tickets en tabla avanzada.
 *
 * Es la vista para escritorio y para cualquier perfil que necesite comparar
 * muchos servicios a la vez: vistas guardadas, filtros, agrupación y
 * configuración de columnas.
 *
 * No consulta datos: los recibe. Eso es lo que permite que convivir con las
 * tarjetas no duplique ni una petición.
 */
export function TicketTableView({
  tickets,
  loading,
  error,
  onViewDetail,
  onSelectionChange,
}: TicketViewProps): React.JSX.Element {
  return (
    <AdvancedTable
      tableId={TABLE_IDS.TICKETS}
      columns={ticketColumns}
      data={tickets}
      getRowId={getTicketRowId}
      loading={loading}
      error={error}
      enableRowSelection
      {...(onSelectionChange === undefined ? {} : { onRowSelectionChange: onSelectionChange })}
      searchPlaceholder="Buscar por ticket, cliente, sucursal..."
      emptyMessage="No hay tickets que coincidan con la búsqueda"
      rowActions={(ticket) => (
        <RowActions
          row={ticket}
          label={`Acciones del ticket ${ticket.number}`}
          actions={[{ id: 'ver-detalle', label: 'Ver detalle', icon: Eye, onSelect: onViewDetail }]}
        />
      )}
      // Tickets es el único módulo con tabla avanzada. Los administrativos
      // siguen con el BaseTable, que es lo que necesitan.
      capabilities={{ views: true, columnSettings: true, grouping: true, filters: true }}
    />
  );
}
