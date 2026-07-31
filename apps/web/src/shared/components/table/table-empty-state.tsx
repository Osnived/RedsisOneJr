import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface TableEmptyStateProps {
  columnCount: number;
  message?: string;
  /** Aclaración opcional: por qué está vacío o qué hacer al respecto. */
  description?: string;
  /** Acción sugerida, por ejemplo crear el primer registro. */
  action?: ReactNode;
}

/**
 * Estado sin registros.
 *
 * Se distingue del estado de error a propósito: una tabla vacía es un resultado
 * normal, no un fallo, y el mensaje no debe alarmar.
 */
export function TableEmptyState({
  columnCount,
  message = 'No hay registros para mostrar',
  description,
  action,
}: TableEmptyStateProps): React.JSX.Element {
  return (
    <tbody>
      <tr>
        <td colSpan={columnCount} className="px-3 py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <Inbox className="size-8 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-sm font-medium">{message}</p>
            {description ? (
              <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
            ) : null}
            {action ? <div className="mt-2">{action}</div> : null}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
