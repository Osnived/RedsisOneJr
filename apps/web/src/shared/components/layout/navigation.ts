import {
  Building2,
  ClipboardList,
  Contact,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { APP_MODULES, APP_MODULE_DEFINITIONS, type AppModule } from '@redsis/contracts';
import type { AuthorizationService } from '@/shared/lib/authorization';

/**
 * Icono de cada módulo.
 *
 * Vive aquí y no en el catálogo compartido porque un icono es una decisión de
 * interfaz: el backend no debe opinar sobre cómo se dibuja un módulo.
 */
const MODULE_ICONS: Record<AppModule, LucideIcon> = {
  [APP_MODULES.DASHBOARD]: LayoutDashboard,
  [APP_MODULES.TICKETS]: Ticket,
  [APP_MODULES.TECHNICIANS]: Wrench,
  [APP_MODULES.FORMS]: ClipboardList,
  [APP_MODULES.CLIENTS]: Contact,
  [APP_MODULES.BRANCHES]: Building2,
  [APP_MODULES.MAPS]: Map,
  [APP_MODULES.REPORTS]: ClipboardList,
  [APP_MODULES.USERS]: Users,
  [APP_MODULES.SETTINGS]: Settings,
  [APP_MODULES.SECURITY]: ShieldCheck,
};

export interface NavigationItem {
  module: AppModule;
  to: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Menú del usuario, construido a partir de sus accesos.
 *
 * No existe un menú por rol ni una lista mantenida a mano: se recorre el
 * catálogo y se deja lo que el usuario puede abrir. Si un rol pierde el acceso a
 * un módulo, el módulo desaparece sin tocar este archivo.
 *
 * Se descartan los módulos sin pantalla: conceder acceso a Clientes antes de que
 * Clientes exista es válido, pero enlazar a una ruta que no está sería un enlace
 * roto.
 */
export function buildNavigation(auth: AuthorizationService): NavigationItem[] {
  return APP_MODULE_DEFINITIONS.filter(
    (definition) => definition.route !== null && auth.canAccess(definition.key),
  ).map((definition) => ({
    module: definition.key,
    // El filtro ya garantiza que no es nulo; el tipo no puede saberlo.
    to: definition.route ?? '/',
    label: definition.label,
    icon: MODULE_ICONS[definition.key],
  }));
}
