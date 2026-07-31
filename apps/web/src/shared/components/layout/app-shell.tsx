import { Link, useRouterState } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { useAuthorization } from '@/shared/hooks/use-authorization';
import { useLogout } from '@/features/auth/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/shared/lib/utils';
import { buildNavigation, type NavigationItem } from './navigation';

export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const auth = useAuthorization();
  const logout = useLogout();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });

  const visibleItems = buildNavigation(auth);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Escritorio: barra lateral fija. Móvil: barra inferior.
          Son interfaces distintas, no la misma oculta (ver AGENTS.md). */}
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-5">
          <p className="text-sm font-semibold">Redsis One Jr</p>
          <p className="text-xs opacity-70">Plataforma empresarial</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegación principal">
          {visibleItems.map((item) => (
            <SidebarLink key={item.module} item={item} isActive={currentPath === item.to} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <p className="truncate px-3 pb-2 text-xs opacity-70">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-white/10"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? <Spinner /> : <LogOut aria-hidden="true" />}
            Salir
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="text-sm font-semibold">Redsis One Jr</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Salir"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? <Spinner /> : <LogOut aria-hidden="true" />}
          </Button>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 flex border-t border-border bg-background md:hidden"
          aria-label="Navegación principal"
        >
          {visibleItems.map((item) => (
            <Link
              key={item.module}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                currentPath === item.to ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  isActive,
}: {
  item: NavigationItem;
  isActive: boolean;
}): React.JSX.Element {
  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive ? 'bg-white/15 font-medium' : 'hover:bg-white/10',
      )}
    >
      <item.icon className="size-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}
