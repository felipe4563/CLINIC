'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { IconX } from './icons';
import { GRUPOS_NAV } from '@/lib/navItems';

export default function Sidebar({
  open,
  onNavigate,
  onClose,
}: {
  open: boolean;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const { usuario } = useAuth();
  const pathname = usePathname();

  if (!usuario) return null;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 overflow-hidden border-r border-border bg-sidebar transition-transform duration-200 md:hidden ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full w-64">
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
        {GRUPOS_NAV.map((group) => {
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
