import { useState } from 'react';
import { Bookmark, Plus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useTableViews } from '@/shared/hooks/table/use-table-views';
import { cn } from '@/shared/lib/utils';

/**
 * Barra de vistas guardadas.
 *
 * Una vista es una forma de mirar el módulo: qué columnas, qué filtros, qué
 * orden y cuántas filas por página. Guardarla evita rehacer la misma
 * configuración cada mañana.
 *
 * No sabe dónde se guardan las vistas. Hoy es `localStorage` y mañana será
 * PostgreSQL; este componente no cambia porque nunca llega a saberlo.
 */
export function ViewsBar(): React.JSX.Element {
  const { views, activeViewId, create, apply, remove } = useTableViews();
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');

  const trimmedName = name.trim();
  const isNameTaken = views.some((view) => view.name === trimmedName);
  const canSave = trimmedName.length > 0 && !isNameTaken;

  function cancelNaming(): void {
    setIsNaming(false);
    setName('');
  }

  function save(): void {
    if (!canSave) {
      return;
    }

    create(trimmedName);
    cancelNaming();
  }

  return (
    <div
      role="toolbar"
      aria-label="Vistas guardadas"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
    >
      <Bookmark className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

      {views.length === 0 ? (
        <span className="text-sm text-muted-foreground">Sin vistas guardadas</span>
      ) : (
        views.map((view) => {
          const isActive = view.id === activeViewId;

          return (
            <span
              key={view.id}
              className={cn(
                'inline-flex items-center rounded-md border text-sm',
                isActive ? 'border-primary bg-primary/10' : 'border-border',
              )}
            >
              {/* Pulsar la vista activa la vuelve a aplicar en lugar de
                  desactivarla: es la forma de deshacer los ajustes que se
                  hicieron a mano después de aplicarla. */}
              <button
                type="button"
                onClick={() => apply(view.id)}
                aria-pressed={isActive}
                className="px-2 py-1"
              >
                {view.name}
              </button>

              <button
                type="button"
                onClick={() => remove(view.id)}
                aria-label={`Eliminar la vista ${view.name}`}
                className="px-1.5 py-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          );
        })
      )}

      <div className="ml-auto flex items-center gap-2">
        {isNaming ? (
          <>
            <Input
              // Se enfoca solo porque el campo aparece a petición del usuario:
              // obligarle a un clic más para escribir lo que acaba de pedir sobra.
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  save();
                }

                if (event.key === 'Escape') {
                  cancelNaming();
                }
              }}
              placeholder="Nombre de la vista"
              aria-label="Nombre de la vista"
              aria-invalid={isNameTaken}
              className="h-8 w-48"
            />

            <Button size="sm" onClick={save} disabled={!canSave}>
              Guardar
            </Button>

            <Button variant="ghost" size="sm" onClick={cancelNaming}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsNaming(true)}>
            <Plus aria-hidden="true" />
            Guardar vista
          </Button>
        )}
      </div>

      {isNaming && isNameTaken ? (
        <p role="alert" className="w-full text-xs text-destructive">
          Ya existe una vista con ese nombre
        </p>
      ) : null}
    </div>
  );
}
