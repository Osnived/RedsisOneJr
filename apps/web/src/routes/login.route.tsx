import { createRoute, redirect } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/login-form';
import { useAuthStore } from '@/stores/auth.store';
import { rootRoute } from './root.route';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  // Quien ya tiene sesión no necesita ver el formulario.
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Redsis One Jr</CardTitle>
          <CardDescription>Ingresa con tu cuenta corporativa</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
