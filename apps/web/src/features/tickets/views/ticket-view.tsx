import { createElement } from 'react';
import type { ViewKind } from '@/shared/lib/view-mode';
import { resolveTicketView } from './registry';
import type { TicketViewProps } from './ticket-view.types';

interface TicketViewSwitchProps extends TicketViewProps {
  /** Vista a dibujar. La decide `useViewMode`, nunca la pantalla. */
  kind: ViewKind;
}

/**
 * Dibuja la vista de Tickets que corresponda.
 *
 * El despacho vive aquí y no en la pantalla para que la página no contenga
 * ninguna condición sobre cómo se representa el módulo: pide una vista y recibe
 * la que toca.
 *
 * Se usa `createElement` en lugar de asignar el componente a una variable y
 * dibujarlo como JSX porque el compilador de React no puede distinguir entre
 * *elegir* un componente existente y *crear* uno nuevo en cada render, y lo
 * rechaza. El resultado es el mismo.
 */
export function TicketView({ kind, ...props }: TicketViewSwitchProps): React.JSX.Element {
  return createElement(resolveTicketView(kind), props);
}
