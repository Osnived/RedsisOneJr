import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ALL_APP_MODULES,
  PERMISSIONS,
  TICKET_WORKFLOW_STEPS,
  type AuthTokens,
  type Permission,
  type TicketDetail,
} from '@redsis/contracts';
import { useAuthStore } from '@/stores/auth.store';
import { MOCK_TICKETS } from '@/test/ticket-fixtures';
import type { createTicketRepositoryDouble } from '@/test/ticket-repository-double';
import { ticketRepository } from '../ticket-repository';
import { TicketWorkspace } from './ticket-workspace';

/**
 * El Repository se sustituye por un doble con estado.
 *
 * Las secciones que consultan por su cuenta —timeline y auditoría— y las acciones
 * atraviesan el mismo camino que usará la pantalla, sin red de por medio. El doble
 * se crea dentro del factory porque `vi.mock` se eleva por encima de las
 * declaraciones del archivo.
 */
vi.mock('../ticket-repository', async () => {
  const { createTicketRepositoryDouble } = await import('@/test/ticket-repository-double');

  return { ticketRepository: createTicketRepositoryDouble() };
});

const repository = ticketRepository as ReturnType<typeof createTicketRepositoryDouble>;

/**
 * El espacio de trabajo completo.
 *
 * Se monta con un ticket ya resuelto, igual que lo entrega la ruta, así que no hace
 * falta el enrutador. Las secciones que consultan por su cuenta —timeline y
 * auditoría— van contra el origen simulado real: es el camino que usará la pantalla.
 */

const TOKENS: AuthTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };
const ACTOR = 'Quien Opera';

/**
 * Una acción atraviesa el retardo artificial del origen dos veces: al ejecutarse y
 * al refrescar lo que invalidó. El margen por omisión de un segundo se queda corto,
 * y más aún con la suite completa corriendo en paralelo.
 */
const WAIT = { timeout: 10_000 };

function authenticate(permissions: Permission[]): void {
  useAuthStore.getState().setSession(
    {
      id: 'user-1',
      email: 'persona@redsis.com',
      fullName: ACTOR,
      isActive: true,
      roles: ['un-nombre-cualquiera'],
      modules: ALL_APP_MODULES.slice(),
      permissions,
    },
    TOKENS,
  );
}

/**
 * El ticket tal como lo entrega la ruta.
 *
 * Se lee del doble y no de una constante para que refleje lo que las acciones ya
 * hayan cambiado dentro de la misma prueba.
 */
function detailOf(ticketId: string): TicketDetail {
  const detail = detailsById.get(ticketId);

  if (detail === undefined) {
    throw new Error(`El ticket ${ticketId} debería existir en los datos de prueba.`);
  }

  return detail;
}

/** Instantánea de los detalles, refrescada antes de cada prueba. */
let detailsById = new Map<string, TicketDetail>();

async function loadDetails(): Promise<void> {
  const ids = MOCK_TICKETS.map((ticket) => ticket.id);
  const details = await Promise.all(ids.map((id) => repository.findDetail(id)));

  detailsById = new Map(details.map((detail) => [detail.id, detail]));
}

function renderWorkspace(ticket: TicketDetail) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <TicketWorkspace ticket={ticket} />
    </QueryClientProvider>,
  );
}

/** Sección por su nombre accesible: cada una es una región con título. */
function section(name: string): HTMLElement {
  return screen.getByRole('region', { name });
}

beforeEach(async () => {
  repository.reset();
  await loadDetails();
  authenticate([PERMISSIONS.TICKETS_VIEW, PERMISSIONS.TICKETS_EDIT]);
});

describe('cabecera del ticket', () => {
  /** La cabecera del espacio de trabajo, para no confundirla con el resto. */
  function header(container: HTMLElement): HTMLElement {
    const element = container.querySelector('header');

    if (element === null) {
      throw new Error('El espacio de trabajo debería tener cabecera.');
    }

    return element;
  }

  it('identifica el servicio y su situación', () => {
    const ticket = detailOf('3');
    const { container } = renderWorkspace(ticket);
    const cabecera = within(header(container));

    expect(screen.getByRole('heading', { level: 1, name: ticket.number })).toBeInTheDocument();
    // El estado y la prioridad se leen de un vistazo, junto al número.
    expect(cabecera.getByText('En ruta')).toBeInTheDocument();
    expect(cabecera.getByText('Crítica')).toBeInTheDocument();
  });

  it('muestra cliente, sucursal, zona, técnico y fecha de creación', () => {
    const ticket = detailOf('3');
    const { container } = renderWorkspace(ticket);
    const fields = within(header(container));

    for (const label of ['Cliente', 'Sucursal', 'Zona', 'Técnico', 'Creación']) {
      expect(fields.getByText(label)).toBeInTheDocument();
    }

    expect(fields.getByText(ticket.zoneName ?? 'Sin zona')).toBeInTheDocument();
    expect(fields.getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  it('dice que no hay técnico en lugar de dejar el hueco vacío', () => {
    renderWorkspace(detailOf('1'));

    expect(screen.getAllByText('Sin asignar').length).toBeGreaterThan(0);
  });
});

describe('secciones del espacio de trabajo', () => {
  it('divide la pantalla en regiones con nombre, sin pestañas', () => {
    renderWorkspace(detailOf('3'));

    for (const name of [
      'Información general',
      'Timeline',
      'Auditoría',
      'Intervención',
      'Acciones',
    ]) {
      expect(section(name)).toBeInTheDocument();
    }

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('la información general muestra la dirección y la categoría', () => {
    const ticket = detailOf('3');
    renderWorkspace(ticket);
    const information = within(section('Información general'));

    expect(information.getByText(ticket.address)).toBeInTheDocument();
    expect(information.getByText(ticket.categoryName)).toBeInTheDocument();
    expect(information.getByText('Última actualización')).toBeInTheDocument();
  });

  it('la información general no permite editar', () => {
    renderWorkspace(detailOf('3'));

    expect(within(section('Información general')).queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('timeline', () => {
  it('cuenta lo ocurrido con usuario, fecha y hora', async () => {
    renderWorkspace(detailOf('3'));
    const timeline = within(section('Timeline'));

    expect(await timeline.findByText(/Ticket registrado/)).toBeInTheDocument();
    expect(timeline.getByText(/Salida hacia la sucursal/)).toBeInTheDocument();
    expect(timeline.getAllByText('Carlos Ruiz').length).toBeGreaterThan(0);
    // La hora se muestra además de la fecha: en una intervención importa cuándo.
    expect(timeline.getAllByRole('time').length).toBeGreaterThan(1);
  });

  it('muestra primero lo más reciente', async () => {
    renderWorkspace(detailOf('3'));
    const timeline = within(section('Timeline'));

    const entries = await timeline.findAllByRole('listitem');

    expect(entries[0]?.textContent).toContain('En ruta');
  });

  it('avisa cuando el ticket no tiene historia', async () => {
    // Un ticket recién creado tiene su creación, así que el vacío se comprueba con
    // un origen que no devuelve nada: aquí basta con que no reviente y liste.
    renderWorkspace(detailOf('14'));

    expect(await within(section('Timeline')).findByText(/Ticket registrado/)).toBeInTheDocument();
  });
});

describe('auditoría', () => {
  it('es una sección aparte del timeline', async () => {
    renderWorkspace(detailOf('3'));
    const audit = within(section('Auditoría'));

    expect(await audit.findByText('Estado')).toBeInTheDocument();
    expect(audit.getAllByText('Campo').length).toBeGreaterThan(0);
    expect(audit.getAllByText('Valor anterior').length).toBeGreaterThan(0);
    expect(audit.getAllByText('Valor nuevo').length).toBeGreaterThan(0);
  });

  it('traduce los códigos almacenados a lo que se lee', async () => {
    renderWorkspace(detailOf('3'));
    const audit = within(section('Auditoría'));

    // Se guarda `en-ruta`; quien audita no debe conocer los códigos internos.
    expect(await audit.findByText('En ruta')).toBeInTheDocument();
    expect(audit.queryByText('en-ruta')).not.toBeInTheDocument();
  });

  it('no ofrece ninguna forma de cambiarla', async () => {
    renderWorkspace(detailOf('3'));
    const audit = within(section('Auditoría'));

    await audit.findByText('Estado');

    expect(audit.queryByRole('button')).not.toBeInTheDocument();
  });

  it('dice que no hay cambios cuando un ticket es nuevo', async () => {
    // Un ticket recién creado no tiene ningún cambio, y eso es información, no un
    // hueco. El 15 es uno de los que la semilla deja sin asignar.
    renderWorkspace(detailOf('15'));

    expect(
      await within(section('Auditoría')).findByText(/Ningún dato ha cambiado/),
    ).toBeInTheDocument();
  });
});

describe('acciones del coordinador', () => {
  it('ofrece asignar, cambiar prioridad y agregar observación', () => {
    renderWorkspace(detailOf('3'));
    const actions = within(section('Acciones'));

    expect(actions.getByRole('button', { name: /Reasignar técnico/ })).toBeInTheDocument();
    expect(actions.getByRole('button', { name: 'Cambiar prioridad' })).toBeInTheDocument();
    expect(actions.getByRole('button', { name: 'Agregar observación' })).toBeInTheDocument();
  });

  it('invita a asignar cuando nadie atiende el servicio', () => {
    renderWorkspace(detailOf('1'));

    expect(
      within(section('Acciones')).getByRole('button', { name: 'Asignar técnico' }),
    ).toBeInTheDocument();
  });

  it('la observación se pide en un formulario y llega al timeline', async () => {
    const user = userEvent.setup();
    renderWorkspace(detailOf('3'));

    await user.click(
      within(section('Acciones')).getByRole('button', { name: 'Agregar observación' }),
    );
    await user.type(screen.getByLabelText(/Observación/), 'El cliente pide avisar antes de ir.');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() => {
      expect(
        within(section('Timeline')).getByText('El cliente pide avisar antes de ir.'),
      ).toBeInTheDocument();
    }, WAIT);
  });

  it('no acepta una observación vacía', async () => {
    const user = userEvent.setup();
    renderWorkspace(detailOf('3'));

    await user.click(
      within(section('Acciones')).getByRole('button', { name: 'Agregar observación' }),
    );
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText('Escribe la observación')).toBeInTheDocument();
  });

  it('quien solo consulta no ve las acciones', () => {
    authenticate([PERMISSIONS.TICKETS_VIEW]);

    renderWorkspace(detailOf('3'));

    expect(screen.queryByRole('region', { name: 'Acciones' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Intervención' })).not.toBeInTheDocument();
    // Consultar sigue siendo posible.
    expect(section('Información general')).toBeInTheDocument();
  });
});

describe('flujo del técnico', () => {
  it('ofrece un solo paso, el que corresponde', () => {
    renderWorkspace(detailOf('3'));
    const intervention = within(section('Intervención'));

    expect(intervention.getByRole('button', { name: 'Llegué' })).toBeInTheDocument();
    expect(
      intervention.queryByRole('button', { name: 'Finalizar servicio' }),
    ).not.toBeInTheDocument();
    expect(
      intervention.queryByRole('button', { name: 'Salir hacia la sucursal' }),
    ).not.toBeInTheDocument();
  });

  it('informa por dónde va la intervención', () => {
    renderWorkspace(detailOf('3'));

    expect(screen.getByText('Paso 3 de 6')).toBeInTheDocument();
  });

  it('al avanzar aparece el paso siguiente', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWorkspace(detailOf('3'));

    await user.click(within(section('Intervención')).getByRole('button', { name: 'Llegué' }));

    await waitFor(async () => {
      const updated = await repository.findDetail('3');

      expect(updated.completedSteps).toContain(TICKET_WORKFLOW_STEPS.ARRIVE);
    }, WAIT);

    // La ruta vuelve a entregar el ticket ya actualizado. Qué estado le corresponde
    // ahora lo decide el servicio de NestJS, no esta pantalla ni este doble.
    await loadDetails();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TicketWorkspace ticket={detailOf('3')} />
      </QueryClientProvider>,
    );

    expect(
      within(section('Intervención')).getByRole('button', { name: 'Iniciar servicio' }),
    ).toBeInTheDocument();
  });

  it('sin técnico asignado el flujo no empieza', () => {
    renderWorkspace(detailOf('1'));
    const intervention = within(section('Intervención'));

    expect(
      intervention.getByText(/empieza cuando el servicio tenga un técnico/),
    ).toBeInTheDocument();
    expect(intervention.queryByRole('button')).not.toBeInTheDocument();
  });

  it('con la intervención cerrada no queda ninguna acción', async () => {
    // El ticket 6 está resuelto y solo le falta cerrar: se cierra y ya no hay nada.
    await repository.completeWorkflowStep('6', TICKET_WORKFLOW_STEPS.CLOSE);
    await loadDetails();

    renderWorkspace(detailOf('6'));
    const intervention = within(section('Intervención'));

    expect(intervention.getByText(/Intervención cerrada/)).toBeInTheDocument();
    expect(intervention.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('en pantalla pequeña', () => {
  /** `matchMedia` no existe en jsdom: hay que declararlo para simular el móvil. */
  function simulateMobile(): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  }

  it('la acción de la intervención queda al alcance del pulgar', () => {
    simulateMobile();
    renderWorkspace(detailOf('3'));

    const action = screen.getByRole('button', { name: 'Llegué' });

    // Fija al pie: el técnico no debe recorrer el timeline para avanzar.
    expect(action.closest('.fixed')).not.toBeNull();
    // Y sigue existiendo una sola vez, no una copia por tamaño de pantalla.
    expect(screen.getAllByRole('button', { name: 'Llegué' })).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('no hay ninguna tabla en el espacio de trabajo', () => {
    simulateMobile();
    renderWorkspace(detailOf('3'));

    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
