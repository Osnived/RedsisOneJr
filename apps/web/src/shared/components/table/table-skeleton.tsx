interface TableSkeletonProps {
  columnCount: number;
  /** Filas de relleno. Por defecto 5: sugiere contenido sin ocupar la pantalla. */
  rowCount?: number;
}

const DEFAULT_SKELETON_ROWS = 5;

/**
 * Relleno visual mientras se cargan los datos.
 *
 * Se prefiere un esqueleto a un indicador giratorio porque conserva la forma de
 * la tabla: la interfaz no salta cuando llegan los datos reales.
 */
export function TableSkeleton({
  columnCount,
  rowCount = DEFAULT_SKELETON_ROWS,
}: TableSkeletonProps): React.JSX.Element {
  return (
    <tbody aria-busy="true" aria-live="polite">
      {/* Un único texto para lectores de pantalla: anunciar cada celda vacía
          sería ruido inútil. */}
      <tr className="sr-only">
        <td colSpan={columnCount}>Cargando registros...</td>
      </tr>

      {Array.from({ length: rowCount }, (_unused, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border/50 last:border-0" aria-hidden="true">
          {Array.from({ length: columnCount }, (_unusedCell, columnIndex) => (
            <td key={columnIndex} className="px-3 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
