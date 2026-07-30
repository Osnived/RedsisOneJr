import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  columnCount: number;
  message: string;
  /** Si se proporciona, se ofrece reintentar la consulta. */
  onRetry?: () => void;
}

/**
 * Estado de error.
 *
 * Se anuncia con `role="alert"` para que un lector de pantalla lo comunique de
 * inmediato: a diferencia de una tabla vacía, aquí el usuario debe actuar.
 */
export function TableErrorState({
  columnCount,
  message,
  onRetry,
}: TableErrorStateProps): React.JSX.Element {
  return (
    <tbody>
      <tr>
        <td colSpan={columnCount} className="px-3 py-12">
          <div role="alert" className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
            <p className="text-sm font-medium text-destructive">{message}</p>
            {onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                <RotateCcw aria-hidden="true" />
                Reintentar
              </Button>
            ) : null}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
