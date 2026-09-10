'use client';

import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { IconMenu, IconSun, IconMoon, IconLogout } from './icons';

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function Topbar({
  onToggleSidebar,
  onToggleCollapsed,
  collapsed,
}: {
  onToggleSidebar: () => void;
  onToggleCollapsed: () => void;
  collapsed: boolean;
}) {
  const { usuario, logout } = useAuth();
  const { dark, toggle } = useTheme();

  if (!usuario) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-panel px-4 md:px-6">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-foreground/70 hover:bg-accent-soft md:hidden"
          aria-label="Alternar menú"
        >
          <IconMenu />
        </button>
        {collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="hidden rounded-lg p-2 text-foreground/70 hover:bg-accent-soft md:inline-flex"
            aria-label="Mostrar menú lateral"
          >
            <IconMenu />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-foreground/70 hover:bg-accent-soft"
          aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {dark ? <IconSun /> : <IconMoon />}
        </button>

        <div className="mx-2 hidden items-center gap-2 sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {iniciales(usuario.nombre)}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">{usuario.nombre}</p>
            <p className="text-xs text-muted-foreground">{usuario.rol}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft"
          aria-label="Cerrar sesión"
        >
          <IconLogout className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
