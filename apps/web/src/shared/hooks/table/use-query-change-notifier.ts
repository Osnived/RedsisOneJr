import { useEffect, useRef } from 'react';
import type { TableQuery } from '@/shared/types/table';

/**
 * Avisa al consumidor cuando cambia la consulta, solo en modo servidor.
 *
 * Se compara la consulta serializada para no disparar una petición por cada
 * render: sin esto, la identidad del objeto bastaría para pedir los mismos datos
 * en bucle.
 */
export function useQueryChangeNotifier({
  enabled,
  query,
  onQueryChange,
}: {
  enabled: boolean;
  query: TableQuery;
  onQueryChange?: (query: TableQuery) => void;
}): void {
  const serialized = JSON.stringify(query);
  const lastSerialized = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !onQueryChange || lastSerialized.current === serialized) {
      return;
    }

    lastSerialized.current = serialized;
    onQueryChange(JSON.parse(serialized) as TableQuery);
  }, [enabled, onQueryChange, serialized]);
}
