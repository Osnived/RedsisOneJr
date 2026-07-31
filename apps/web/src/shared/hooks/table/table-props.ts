import type { DataTablePresentationProps, DataTableProps } from '@/shared/types/table';
import type { UseDataTableOptions } from './use-data-table';

interface SplitTableProps<TData> {
  /** Lo que necesita el motor para existir. */
  engine: UseDataTableOptions<TData>;
  /** Lo que solo afecta a cómo se dibuja. */
  view: DataTablePresentationProps;
}

/**
 * Reparte las propiedades de una tabla entre el motor y la presentación.
 *
 * `DataTable` y `AdvancedTable` reciben el mismo contrato pero montan la tabla
 * de forma distinta: ambos necesitan hacer este reparto y hacerlo igual. Aquí es
 * una función pura, así que se prueba sin montar nada y no puede divergir entre
 * las dos tablas.
 *
 * Las opcionales se omiten en lugar de enviarse como `undefined`: con
 * `exactOptionalPropertyTypes` no es lo mismo, y enviar `undefined` pisaría los
 * valores por defecto de quien las recibe.
 */
export function splitTableProps<TData>(props: DataTableProps<TData>): SplitTableProps<TData> {
  const {
    tableId,
    columns,
    data,
    getRowId,
    rowActions,
    rowNavigation,
    enableRowSelection,
    onRowSelectionChange,
    mode,
    totalRows,
    onQueryChange,
    loading,
    error,
    toolbar,
    emptyMessage,
    enableSearch,
    searchPlaceholder,
  } = props;

  return {
    engine: {
      tableId,
      columns,
      data,
      getRowId,
      ...(rowActions === undefined ? {} : { rowActions }),
      ...(rowNavigation === undefined ? {} : { rowNavigation }),
      ...(enableRowSelection === undefined ? {} : { enableRowSelection }),
      ...(onRowSelectionChange === undefined ? {} : { onRowSelectionChange }),
      ...(mode === undefined ? {} : { mode }),
      ...(totalRows === undefined ? {} : { totalRows }),
      ...(onQueryChange === undefined ? {} : { onQueryChange }),
    },
    view: {
      ...(loading === undefined ? {} : { loading }),
      ...(error === undefined ? {} : { error }),
      ...(toolbar === undefined ? {} : { toolbar }),
      ...(emptyMessage === undefined ? {} : { emptyMessage }),
      ...(enableSearch === undefined ? {} : { enableSearch }),
      ...(searchPlaceholder === undefined ? {} : { searchPlaceholder }),
    },
  };
}
