import { useEffect, useState } from 'react';
import { splitTableProps } from '@/shared/hooks/table/table-props';
import {
  IMPLEMENTED_CAPABILITIES,
  NO_ADVANCED_CAPABILITIES,
  type AdvancedCapability,
  type AdvancedTableCapabilities,
  type AdvancedTableProps,
} from '@/shared/types/table';
import { ColumnSettingsPanel, ColumnSettingsTrigger } from './column-settings-panel';
import { DataTableView } from './data-table-view';
import { FilterBuilder, FilterBuilderTrigger } from './filter-builder';
import { GroupingSelector } from './grouping-selector';
import { TableProvider } from './table-provider';
import { ViewsBar } from './views-bar';

/**
 * Tabla avanzada.
 *
 * Extiende el BaseTable por composición y no por copia: monta el mismo motor y
 * la misma vista —búsqueda, orden, paginación, estados, selección, columnas,
 * barra de herramientas y acciones de fila— y añade a su alrededor las
 * capacidades avanzadas.
 *
 * Cada capacidad se enciende por separado. Cambiar el BaseTable sigue
 * beneficiando a esta tabla automáticamente, que es justo lo que se perdería con
 * una implementación paralela.
 */
export function AdvancedTable<TData>({
  capabilities,
  viewsBar,
  sidePanel,
  ...dataTableProps
}: AdvancedTableProps<TData>): React.JSX.Element {
  const resolved: AdvancedTableCapabilities = { ...NO_ADVANCED_CAPABILITIES, ...capabilities };

  useUnimplementedCapabilityWarning(resolved);

  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const { engine, view } = splitTableProps<TData>(dataTableProps);

  // Un panel solo puede estar abierto si su capacidad está activa. Se comprueba
  // aquí y no al abrirlo para que apagar la capacidad lo cierre por sí solo.
  const isColumnPanelVisible = resolved.columnSettings && isColumnPanelOpen;
  const isFilterBuilderVisible = resolved.filters && isFilterBuilderOpen;

  return (
    <TableProvider<TData> {...engine}>
      <div className="flex flex-col gap-3">
        {resolved.views ? <ViewsBar /> : null}

        {/* Ranura para barras propias del módulo, junto a la de vistas. */}
        {viewsBar}

        {isFilterBuilderVisible ? (
          <FilterBuilder onClose={() => setIsFilterBuilderOpen(false)} />
        ) : null}

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <DataTableView
              {...view}
              {...(resolved.columnSettings
                ? {
                    columnControls: (
                      <ColumnSettingsTrigger
                        isOpen={isColumnPanelOpen}
                        onToggle={() => setIsColumnPanelOpen((isOpen) => !isOpen)}
                      />
                    ),
                  }
                : {})}
              advancedControls={
                <>
                  {resolved.filters ? (
                    <FilterBuilderTrigger
                      isOpen={isFilterBuilderOpen}
                      onToggle={() => setIsFilterBuilderOpen((isOpen) => !isOpen)}
                    />
                  ) : null}
                  {resolved.grouping ? <GroupingSelector /> : null}
                </>
              }
            />
          </div>

          {isColumnPanelVisible ? (
            <ColumnSettingsPanel onClose={() => setIsColumnPanelOpen(false)} />
          ) : null}

          {/* Ranura para paneles laterales propios del módulo. */}
          {sidePanel}
        </div>
      </div>
    </TableProvider>
  );
}

/**
 * Avisa si se habilita una capacidad que todavía no existe.
 *
 * Sin esto, activar `kanban` antes de implementarlo no haría nada y parecería un
 * fallo de la tabla. El aviso deja claro que la capacidad está declarada pero
 * pendiente.
 */
function useUnimplementedCapabilityWarning(capabilities: AdvancedTableCapabilities): void {
  const enabled = Object.entries(capabilities)
    .filter(([, isEnabled]) => isEnabled)
    .map(([capability]) => capability as AdvancedCapability);

  const pending = enabled.filter((capability) => !IMPLEMENTED_CAPABILITIES.includes(capability));
  const serialized = pending.join(',');

  useEffect(() => {
    if (serialized.length === 0) {
      return;
    }

    console.warn(
      `AdvancedTable: capacidades habilitadas pero aún no implementadas: ${serialized}. ` +
        'La tabla funciona como BaseTable mientras tanto.',
    );
  }, [serialized]);
}
