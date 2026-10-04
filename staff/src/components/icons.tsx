import {
  Home,
  CircleUserRound,
  LayoutDashboard,
  CalendarDays,
  Users,
  LayoutGrid,
  UserCog,
  ClipboardList,
  Banknote,
  Package,
  BarChart3,
  Heart,
  LogOut,
  Sun,
  Moon,
  Clock,
  UserCheck,
  ShoppingCart,
  Truck,
  Bell,
  Wallet,
  Settings,
  ChevronDown,
} from 'lucide-react';

type IconProps = { className?: string };

const base = 'w-5 h-5';

export function IconHome({ className = base }: IconProps) {
  return <Home className={className} strokeWidth={1.8} />;
}

export function IconUserCircle({ className = base }: IconProps) {
  return <CircleUserRound className={className} strokeWidth={1.8} />;
}

export function IconDashboard({ className = base }: IconProps) {
  return <LayoutDashboard className={className} strokeWidth={1.8} />;
}

export function IconCalendar({ className = base }: IconProps) {
  return <CalendarDays className={className} strokeWidth={1.8} />;
}

export function IconUsers({ className = base }: IconProps) {
  return <Users className={className} strokeWidth={1.8} />;
}

export function IconCatalog({ className = base }: IconProps) {
  return <LayoutGrid className={className} strokeWidth={1.8} />;
}

export function IconUserCog({ className = base }: IconProps) {
  return <UserCog className={className} strokeWidth={1.8} />;
}

export function IconMenu({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconSun({ className = base }: IconProps) {
  return <Sun className={className} strokeWidth={1.8} />;
}

export function IconMoon({ className = base }: IconProps) {
  return <Moon className={className} strokeWidth={1.8} />;
}

export function IconX({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconPanelLeft({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9.5 4v16" />
    </svg>
  );
}

export function IconClipboard({ className = base }: IconProps) {
  return <ClipboardList className={className} strokeWidth={1.8} />;
}

export function IconCashRegister({ className = base }: IconProps) {
  return <Banknote className={className} strokeWidth={1.8} />;
}

export function IconBox({ className = base }: IconProps) {
  return <Package className={className} strokeWidth={1.8} />;
}

export function IconBarChart({ className = base }: IconProps) {
  return <BarChart3 className={className} strokeWidth={1.8} />;
}

export function IconHeart({ className = base }: IconProps) {
  return <Heart className={className} strokeWidth={1.8} />;
}

export function IconSparkle({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.5 11l2.5 1.5-2.5 1.5-1.5 2.5-1.5-2.5L8 12.5l2.5-1.5L12 8.5Z" />
    </svg>
  );
}

export function IconLogout({ className = base }: IconProps) {
  return <LogOut className={className} strokeWidth={1.8} />;
}

export function IconTrendUp({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function IconClock({ className = base }: IconProps) {
  return <Clock className={className} strokeWidth={1.8} />;
}

export function IconUserCheck({ className = base }: IconProps) {
  return <UserCheck className={className} strokeWidth={1.8} />;
}

export function IconUserPlus({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M2 20c.7-3.2 3.1-5.2 6.5-5.2s5.8 2 6.5 5.2" />
      <path d="M18.5 8v6M15.5 11h6" />
    </svg>
  );
}

export function IconMail({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6.5 8 6.2 8-6.2" />
    </svg>
  );
}

export function IconLock({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <path d="M12 14.5v3" />
    </svg>
  );
}

export function IconEye({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.3M6.3 6.4C3.7 8.1 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function IconAlertCircle({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function IconShoppingCart({ className = base }: IconProps) {
  return <ShoppingCart className={className} strokeWidth={1.8} />;
}

export function IconPhoto({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="15" rx="2.2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 15.5 15.5 11 6 19.5" />
    </svg>
  );
}

export function IconTruck({ className = base }: IconProps) {
  return <Truck className={className} strokeWidth={1.8} />;
}

export function IconTrash({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M18.5 7l-.8 12.4a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9L5.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconBell({ className = base }: IconProps) {
  return <Bell className={className} strokeWidth={1.8} />;
}

export function IconWallet({ className = base }: IconProps) {
  return <Wallet className={className} strokeWidth={1.8} />;
}

export function IconSettings({ className = base }: IconProps) {
  return <Settings className={className} strokeWidth={1.8} />;
}

export function IconChevronDown({ className = base }: IconProps) {
  return <ChevronDown className={className} strokeWidth={1.8} />;
}

export function IconCruzMedica({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5h6a1 1 0 0 1 1 1V9h4.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H16v4.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V17H3.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1H8V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
