import type { ColumnDefinition } from '@/types/table';

/**
 * Datos de prueba del framework. Son deliberadamente genéricos: el framework no
 * conoce ningún módulo, así que sus pruebas tampoco deben conocerlo.
 */
export interface DemoRow {
  id: string;
  name: string;
  amount: number;
  active: boolean;
  createdAt: Date;
  notes: string | null;
}

export function buildDemoRows(count: number): DemoRow[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `row-${index + 1}`,
    name: `Registro ${String(index + 1).padStart(3, '0')}`,
    amount: (index + 1) * 10,
    active: index % 2 === 0,
    createdAt: new Date(Date.UTC(2026, 0, (index % 28) + 1)),
    notes: index % 3 === 0 ? null : `Nota ${index + 1}`,
  }));
}

export const DEMO_COLUMNS: ColumnDefinition<DemoRow>[] = [
  {
    id: 'name',
    header: 'Nombre',
    accessor: (row) => row.name,
    hideable: false,
  },
  {
    id: 'amount',
    header: 'Monto',
    accessor: (row) => row.amount,
    align: 'right',
    width: 120,
  },
  {
    id: 'active',
    header: 'Activo',
    accessor: (row) => row.active,
    align: 'center',
  },
  {
    id: 'notes',
    header: 'Notas',
    accessor: (row) => row.notes,
    sortable: false,
    hiddenByDefault: true,
  },
];

export const getDemoRowId = (row: DemoRow): string => row.id;
