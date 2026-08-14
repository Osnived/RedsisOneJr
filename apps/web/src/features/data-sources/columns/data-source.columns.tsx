import { findDataSourceProvider, type DataSourceSummary } from '@redsis/contracts';
import { Badge } from '@/shared/components/ui/badge';
import { DateTime } from '@/shared/components/ui/date-time';
import { defineColumns } from '@/shared/lib/table/registry';

/**
 * Columnas de las fuentes de datos.
 *
 * Se muestra el nombre visible del proveedor y no su clave: `redsis-one` es un
 * identificador y "RedsisOne / OneBoards" es lo que alguien reconoce.
 *
 * **Ninguna columna muestra credenciales**, porque la API no las devuelve. Lo que
 * se puede decir es si las hay.
 */
export const dataSourceColumns = defineColumns<DataSourceSummary>([
  {
    id: 'name',
    header: 'Nombre',
    accessor: (source) => source.name,
    hideable: false,
    width: 200,
    cell: (source) => (
      <span className="flex items-center gap-2">
        <span className="font-medium">{source.name}</span>
        {source.isDefault ? <Badge variant="info">Por defecto</Badge> : null}
      </span>
    ),
  },
  {
    id: 'provider',
    header: 'Proveedor',
    accessor: (source) => findDataSourceProvider(source.provider)?.label ?? source.provider,
    width: 190,
  },
  {
    id: 'isActive',
    header: 'Estado',
    accessor: (source) => source.isActive,
    width: 110,
    align: 'center',
    cell: (source) => (
      <Badge variant={source.isActive ? 'success' : 'neutral'}>
        {source.isActive ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
  },
  {
    id: 'hasCredentials',
    header: 'Credenciales',
    accessor: (source) => source.hasCredentials,
    width: 130,
    align: 'center',
    cell: (source) => (
      <Badge variant={source.hasCredentials ? 'success' : 'warning'}>
        {source.hasCredentials ? 'Guardadas' : 'Sin configurar'}
      </Badge>
    ),
  },
  {
    id: 'lastCheck',
    header: 'Última comprobación',
    accessor: (source) => (source.lastCheckedAt === null ? null : new Date(source.lastCheckedAt)),
    width: 180,
    cell: (source) =>
      source.lastCheckedAt === null ? (
        <span className="text-muted-foreground">Sin comprobar</span>
      ) : (
        <span className="flex items-center gap-2">
          <Badge variant={source.lastCheckOk === true ? 'success' : 'danger'}>
            {source.lastCheckOk === true ? 'Conecta' : 'Falla'}
          </Badge>
          <DateTime value={source.lastCheckedAt} format="date" />
        </span>
      ),
  },
]);

export const getDataSourceRowId = (source: DataSourceSummary): string => source.id;
