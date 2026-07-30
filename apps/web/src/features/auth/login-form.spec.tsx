import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './login-form';

const loginMutate = vi.fn();
const loginState = { isPending: false, isError: false, error: null as unknown };

vi.mock('./use-auth', () => ({
  useLogin: () => ({
    mutate: loginMutate,
    get isPending() {
      return loginState.isPending;
    },
    get isError() {
      return loginState.isError;
    },
    get error() {
      return loginState.error;
    },
  }),
}));

function renderForm(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe('LoginForm', () => {
  it('muestra los campos de acceso', () => {
    renderForm();

    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('no envía la petición si el correo no es válido', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo'), 'no-es-un-correo');
    await user.type(screen.getByLabelText('Contraseña'), 'Redsis2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByText('Correo inválido')).toBeInTheDocument();
    });
    expect(loginMutate).not.toHaveBeenCalled();
  });

  it('exige la contraseña', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo'), 'admin@redsis.com');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });
    expect(loginMutate).not.toHaveBeenCalled();
  });

  it('envía las credenciales cuando el formulario es válido', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo'), 'admin@redsis.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Redsis2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(loginMutate).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@redsis.com', password: 'Redsis2026' }),
      );
    });
  });

  it('normaliza el correo a minúsculas antes de enviarlo', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo'), 'ADMIN@REDSIS.COM');
    await user.type(screen.getByLabelText('Contraseña'), 'Redsis2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(loginMutate).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@redsis.com' }),
      );
    });
  });

  it('marca los campos inválidos para los lectores de pantalla', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Correo'), 'malo');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
