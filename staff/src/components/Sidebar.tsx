'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  IconDashboard,
  IconCalendar,
  IconUsers,
  IconCatalog,
  IconUserCog,
  IconX,
  IconWallet,
  IconClipboard,
  IconCashRegister,
  IconBox,
  IconShoppingCart,
  IconBarChart,
  IconHeart,
  IconBell,
  IconClock,
  IconUserCheck,
  IconSettings,
} from './icons';

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => React.JSX.Element; permiso: string };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: IconDashboard, permiso: 'dashboard' }],
  },
  {
    label: 'Operación',
    items: [
      { href: '/agenda', label: 'Agenda', icon: IconCalendar, permiso: 'agenda' },
      { href: '/pacientes', label: 'Pacientes', icon: IconUsers, permiso: 'pacientes' },
      { href: '/tratamientos', label: 'Tratamientos', icon: IconClipboard, permiso: 'pacientes' },
      { href: '/saldos', label: 'Saldos pendientes', icon: IconWallet, permiso: 'pacientes' },
      { href: '/ventas', label: 'Ventas (POS)', icon: IconShoppingCart, permiso: 'ventas' },
      { href: '/mi-asistencia', label: 'Mi asistencia', icon: IconClock, permiso: 'dashboard' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/caja', label: 'Caja', icon: IconCashRegister, permiso: 'caja' },
      { href: '/inventario', label: 'Inventario', icon: IconBox, permiso: 'inventario' },
      { href: '/catalogo', label: 'Catálogo', icon: IconCatalog, permiso: 'catalogo' },
      { href: '/usuarios', label: 'Usuarios', icon: IconUserCog, permiso: 'usuarios' },
      { href: '/automatizacion', label: 'Automatización', icon: IconBell, permiso: 'automatizacion' },
      { href: '/personal', label: 'Control de Personal', icon: IconUserCheck, permiso: 'personal' },
      { href: '/reportes', label: 'Reportes', icon: IconBarChart, permiso: 'reportes' },
      { href: '/configuracion', label: 'Configuración', icon: IconSettings, permiso: 'configuracion' },
    ],
  },
  {
    label: 'Próximamente',
    items: [{ href: '/fidelizacion', label: 'Fidelización', icon: IconHeart, permiso: 'catalogo' }],
  },
];

export default function Sidebar({
  open,
  collapsed,
  onNavigate,
  onClose,
}: {
  open: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const { usuario } = useAuth();
  const pathname = usePathname();

  if (!usuario) return null;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 overflow-hidden border-r border-border bg-sidebar transition-all duration-200 md:static md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'md:w-0 md:border-r-0' : 'md:w-64'}`}
    >
      <div className={`h-full w-64 ${collapsed ? 'md:invisible' : ''}`}>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          N
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">Clinic NovagED</p>
          <p className="truncate text-xs text-muted-foreground">Sistema interno</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-foreground/50 hover:bg-accent-soft hover:text-foreground"
          aria-label="Ocultar menú"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-col gap-6 px-3 py-5">
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => usuario.permisos?.includes(item.permiso));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-accent-soft font-medium text-accent'
                          : 'text-foreground/80 hover:bg-accent-soft/60 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      </div>
    </aside>
  );
}
