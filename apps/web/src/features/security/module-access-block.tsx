import type { AppModule, AppModuleDefinition } from '@redsis/contracts';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';

interface ModuleAccessBlockProps {
  modules: readonly AppModuleDefinition[];
  granted: AppModule[];
  onToggle: (module: AppModule, isGranted: boolean) => void;
  disabled: boolean;
}

/**
 * Acceso a módulos: la primera puerta.
 *
 * Va antes que los permisos porque decide qué módulos **existen** para el rol.
 * Sin acceso, el módulo no aparece en el menú, no se puede abrir escribiendo la
 * URL y el backend responde 403 aunque el rol conserve permisos dentro.
 *
 * Los módulos sin pantalla se marcan como tal en lugar de esconderse: se puede
 * conceder el acceso desde ya, y cuando la pantalla llegue el rol la tendrá sin
 * que nadie tenga que revisar la configuración.
 */
export function ModuleAccessBlock({
  modules,
  granted,
  onToggle,
  disabled,
}: ModuleAccessBlockProps): React.JSX.Element {
  const grantedSet = new Set(granted);

  return (
    <section aria-labelledby="acceso-a-modulos" className="flex flex-col gap-3">
      <div>
        <h3 id="acceso-a-modulos" className="text-sm font-medium">
          Acceso a módulos
        </h3>
        <p className="text-xs text-muted-foreground">
          Qué módulos existen para este rol. Sin acceso, sus permisos no se evalúan.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {modules.map((module) => (
          <li key={module.key}>
            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 hover:bg-accent">
              <Checkbox
                className="mt-0.5"
                name={`modulo-${module.key}`}
                checked={grantedSet.has(module.key)}
                disabled={disabled}
                onChange={(event) => onToggle(module.key, event.target.checked)}
              />

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {module.label}
                  {module.route === null ? <Badge variant="neutral">Sin pantalla</Badge> : null}
                </span>
                <span className="text-xs text-muted-foreground">{module.description}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
