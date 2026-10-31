import {
  IconHome,
  IconDashboard,
  IconCalendar,
  IconUsers,
  IconCatalog,
  IconUserCog,
  IconWallet,
  IconClipboard,
  IconCashRegister,
  IconBox,
  IconTruck,
  IconShoppingCart,
  IconBarChart,
  IconHeart,
  IconBell,
  IconClock,
  IconUserCheck,
  IconSettings,
} from '@/components/icons';

// permiso null: lo ve todo el personal (marcar asistencia no depende del rol).
export type NavItem = { href: string; label: string; icon: (p: { className?: string }) => React.JSX.Element; permiso: string | null };

export function puedeVer(item: NavItem, permisos: string[] | undefined) {
  return item.permiso === null || Boolean(permisos?.includes(item.permiso));
}

export const GRUPOS_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { href: '/inicio', label: 'Inicio', icon: IconHome, permiso: 'dashboard' },
      { href: '/dashboard', label: 'Dashboard', icon: IconDashboard, permiso: 'dashboard' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { href: '/agenda', label: 'Agenda', icon: IconCalendar, permiso: 'agenda' },
      { href: '/pacientes', label: 'Pacientes', icon: IconUsers, permiso: 'pacientes' },
      { href: '/tratamientos', label: 'Tratamientos', icon: IconClipboard, permiso: 'pacientes' },
      { href: '/saldos', label: 'Saldos pendientes', icon: IconWallet, permiso: 'pacientes' },
      { href: '/ventas', label: 'Ventas', icon: IconShoppingCart, permiso: 'ventas' },
      { href: '/mi-asistencia', label: 'Mi asistencia', icon: IconClock, permiso: null },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/caja', label: 'Caja', icon: IconCashRegister, permiso: 'caja' },
      { href: '/inventario', label: 'Inventario', icon: IconBox, permiso: 'inventario' },
      { href: '/compras', label: 'Compras', icon: IconTruck, permiso: 'compras' },
      { href: '/catalogo', label: 'Catálogo', icon: IconCatalog, permiso: 'catalogo' },
      { href: '/usuarios', label: 'Usuarios', icon: IconUserCog, permiso: 'usuarios' },
      { href: '/automatizacion', label: 'Automatización', icon: IconBell, permiso: 'automatizacion' },
      { href: '/personal', label: 'Control de Personal', icon: IconUserCheck, permiso: 'personal' },
      { href: '/reportes', label: 'Reportes', icon: IconBarChart, permiso: 'reportes' },
      { href: '/configuracion', label: 'Configuración', icon: IconSettings, permiso: 'configuracion' },
      { href: '/fidelizacion', label: 'Fidelización', icon: IconHeart, permiso: 'fidelizacion' },
    ],
  },
];
