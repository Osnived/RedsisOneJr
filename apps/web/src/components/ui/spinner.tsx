import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }): React.JSX.Element {
  return (
    <span role="status" aria-label="Cargando">
      <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden="true" />
    </span>
  );
}
