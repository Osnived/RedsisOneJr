import { splitTableProps } from '@/shared/hooks/table/table-props';
import type { DataTableProps } from '@/shared/types/table';
import { DataTableView } from './data-table-view';
import { TableProvider } from './table-provider';

/**
 * Tabla reutilizable de la plataforma.
 *
 * Es el único componente que los módulos necesitan usar: describen las columnas,
 * pasan los datos y el framework resuelve orden, búsqueda, paginación,
 * visibilidad de columnas, redimensionado y persistencia de preferencias.
 *
 * Monta el motor y lo dibuja. Ese reparto en dos piezas —proveedor y vista— es
 * lo que permite que la tabla avanzada reutilice exactamente la misma tabla y
 * le añada controles al lado, en lugar de mantener una implementación paralela.
 */
export function DataTable<TData>(props: DataTableProps<TData>): React.JSX.Element {
  const { engine, view } = splitTableProps(props);

  return (
    <TableProvider<TData> {...engine}>
      <DataTableView {...view} />
    </TableProvider>
  );
}
