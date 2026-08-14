import { AdvancedTable } from '@/shared/components/table';
import { TABLE_IDS } from '@/shared/lib/table/registry';
import { getTicketRowId } from '../columns/ticket.columns';
import type { TicketViewProps } from './ticket-view.types';

/**
 * Tickets en tabla avanzada.
 *
 * Es la vista para escritorio y para cualquier perfil que necesite comparar
 * muchos servicios a la vez: vistas guardadas, filtros, agrupación y
 * configuración de columnas.
 *
 * Su cometido es **localizar** un ticket, no operar sobre él: la fila lleva a su
 * pantalla y ahí ocurre toda la operación. Por eso no declara acciones de fila,
 * aunque el framework las siga soportando para los módulos administrativos.
 *
 * Opera en **modo servidor**: buscar, ordenar, filtrar y paginar los resuelve el
 * origen, no el navegador. Es lo que permite que la tabla sirva para un tablero de
 * cien mil tickets sin traérselos todos.
 *
 * No consulta datos ni conoce sus columnas: las recibe. Eso permite que convivir
 * con las tarjetas no duplique ni una petición, y que un proyecto con otra
 * estructura use esta misma vista sin tocarla.
 */
export function TicketTableView({
  tickets,
  columns,
  totalRows,
  loading,
  error,
  onQueryChange,
  onViewDetail,
  onSelectionChange,
}: TicketViewProps): React.JSX.Element {
  return (
    <AdvancedTable
      tableId={TABLE_IDS.TICKETS}
      columns={columns}
      data={tickets}
      getRowId={getTicketRowId}
      mode="server"
      totalRows={totalRows}
      onQueryChange={onQueryChange}
      loading={loading}
      error={error}
      enableRowSelection
      {...(onSelectionChange === undefined ? {} : { onRowSelectionChange: onSelectionChange })}
      searchPlaceholder="Buscar por ticket, cliente, sucursal..."
      emptyMessage="No hay tickets que coincidan con la búsqueda"
      rowNavigation={{
        onSelect: onViewDetail,
        label: (ticket) => `Abrir el ticket ${ticket.number}`,
      }}
      // Tickets es el único módulo con tabla avanzada. Los administrativos
      // siguen con el BaseTable, que es lo que necesitan.
      capabilities={{ views: true, columnSettings: true, grouping: true, filters: true }}
    />
  );
}
