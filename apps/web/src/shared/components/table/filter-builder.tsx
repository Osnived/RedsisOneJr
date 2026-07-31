import { Filter, Plus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useTableFilters } from '@/shared/hooks/table/use-table-filters';
import {
  FILTER_OPERATORS,
  FILTER_OPERATOR_LABELS,
  operatorNeedsValue,
  type FilterOperator,
} from '@/shared/types/table';

const SELECT_CLASS = 'h-9 rounded-md border border-input bg-background px-2 text-sm';

interface FilterBuilderProps {
  onClose: () => void;
}

/**
 * Constructor visual de filtros.
 *
 * Cada línea es una condición: columna, operador y valor. Todas se combinan con
 * Y, que es lo que un usuario espera al ir añadiendo condiciones.
 *
 * Se dibuja a lo ancho y no en un panel estrecho porque una condición son tres
 * controles seguidos, y partirlos en tres líneas obligaría a releer cada una
 * para entender qué dice.
 */
export function FilterBuilder({ onClose }: FilterBuilderProps): React.JSX.Element {
  const { filters, filterableColumns, add, update, remove, clear } = useTableFilters();

  return (
    <section
      aria-label="Filtros avanzados"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-medium">Filtros</h2>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar filtros">
          <X aria-hidden="true" />
        </Button>
      </div>

      {filters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin condiciones. Añade una para restringir lo que muestra la tabla.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filters.map((filter, index) => {
            const column = filterableColumns.find((candidate) => candidate.id === filter.columnId);
            const suggestionsId = `sugerencias-${filter.id}`;

            return (
              <li key={filter.id} className="flex flex-wrap items-center gap-2">
                {/* La primera condición no lleva conector; las siguientes dejan
                    claro que se suman en lugar de sustituirse. */}
                <span className="w-8 shrink-0 text-xs uppercase text-muted-foreground">
                  {index === 0 ? 'Donde' : 'Y'}
                </span>

                <select
                  value={filter.columnId}
                  onChange={(event) => update(filter.id, { columnId: event.target.value })}
                  aria-label={`Columna de la condición ${index + 1}`}
                  className={SELECT_CLASS}
                >
                  {filterableColumns.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(event) =>
                    update(filter.id, { operator: event.target.value as FilterOperator })
                  }
                  aria-label={`Operador de la condición ${index + 1}`}
                  className={SELECT_CLASS}
                >
                  {FILTER_OPERATORS.map((operator) => (
                    <option key={operator} value={operator}>
                      {FILTER_OPERATOR_LABELS[operator]}
                    </option>
                  ))}
                </select>

                {operatorNeedsValue(filter.operator) ? (
                  <>
                    <Input
                      value={filter.value}
                      onChange={(event) => update(filter.id, { value: event.target.value })}
                      aria-label={`Valor de la condición ${index + 1}`}
                      list={suggestionsId}
                      className="h-9 w-40"
                    />

                    {/* Los valores que ya existen en los datos se sugieren para
                        no obligar a recordar cómo están escritos. */}
                    <datalist id={suggestionsId}>
                      {(column?.suggestions ?? []).map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  </>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(filter.id)}
                  aria-label={`Quitar la condición ${index + 1}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={add} disabled={filterableColumns.length === 0}>
          <Plus aria-hidden="true" />
          Añadir condición
        </Button>

        {filters.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            Quitar todas
          </Button>
        ) : null}
      </div>
    </section>
  );
}

interface FilterBuilderTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
}

/** Botón que abre el constructor e informa de cuántas condiciones se aplican. */
export function FilterBuilderTrigger({
  isOpen,
  onToggle,
}: FilterBuilderTriggerProps): React.JSX.Element {
  const { activeCount } = useTableFilters();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={
        activeCount === 0 ? 'Filtros, ninguno aplicado' : `Filtros, ${activeCount} aplicados`
      }
    >
      <Filter aria-hidden="true" />
      Filtros
      {activeCount > 0 ? (
        <span className="rounded bg-primary px-1.5 text-xs text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
    </Button>
  );
}
