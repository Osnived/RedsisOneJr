import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { loginSchema, type LoginInput } from '@redsis/contracts';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Spinner } from '@/shared/components/ui/spinner';
import { ApiError } from '@/shared/lib/api-client';
import { useLogin } from './use-auth';

/**
 * Formulario de acceso.
 *
 * La validación usa el mismo esquema Zod que declara el contrato compartido,
 * así el frontend y el backend no pueden discrepar sobre qué es válido.
 */
export function LoginForm(): React.JSX.Element {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {login.isError ? (
        <Alert variant="destructive">
          {login.error instanceof ApiError
            ? login.error.message
            : 'No se pudo conectar con el servidor'}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="usuario@redsis.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={login.isPending} className="mt-2">
        {login.isPending ? <Spinner /> : null}
        {login.isPending ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
}
