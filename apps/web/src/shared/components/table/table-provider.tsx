import type { ReactNode } from 'react';
import { TableContext } from '@/shared/hooks/table/use-table-context';
import { useDataTable, type UseDataTableOptions } from '@/shared/hooks/table/use-data-table';

export interface TableProviderProps<TData> extends UseDataTableOptions<TData> {
  children: ReactNode;
}

/**
 * Crea el motor de la tabla y lo comparte con todo su subárbol.
 *
 * Existe porque hay controles que gobiernan la tabla sin estar dentro de ella:
 * el panel de configuración de columnas se dibuja **al lado**, no debajo de la
 * barra superior. Un hermano no puede leer el estado de otro, y exponerlo hacia
 * arriba obligaría a que cada capacidad avanzada añadiera su propia propiedad.
 *
 * Con el contexto, la tabla y sus controles laterales comparten una sola
 * instancia y una sola fuente de preferencias. Es también lo que necesitarán la
 * barra de vistas, el agrupador y el constructor de filtros.
 *
 * Ninguna pantalla lo monta: `DataTable` y `AdvancedTable` lo hacen por dentro.
 */
export function TableProvider<TData>({
  children,
  ...options
}: TableProviderProps<TData>): React.JSX.Element {
  const value = useDataTable<TData>(options);

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}
