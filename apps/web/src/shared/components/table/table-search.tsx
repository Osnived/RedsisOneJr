import { Search, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Campo de búsqueda de una tabla.
 *
 * No conoce el motor de tablas ni ningún módulo: recibe el texto y avisa de los
 * cambios. Puede reutilizarse en cualquier tabla, e incluso fuera de una.
 */
export function TableSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  className,
}: TableSearchProps): React.JSX.Element {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className="h-9 pl-9 pr-9"
      />
      {/* El botón de limpiar solo aparece cuando hay algo que limpiar. */}
      {value.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange('')}
          className="absolute right-0 top-0 size-9"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
