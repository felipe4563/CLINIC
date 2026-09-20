'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { IconMenu, IconSun, IconMoon, IconLogout, IconHome } from './icons';

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function MenuUsuario() {
  const { usuario, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alHacerClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function alPresionarEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClicFuera);
    document.addEventListener('keydown', alPresionarEscape);
    return () => {
      document.removeEventListener('mousedown', alHacerClicFuera);
      document.removeEventListener('keydown', alPresionarEscape);
    };
  }, [abierto]);

  if (!usuario) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de usuario"
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent-soft"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {iniciales(usuario.nombre)}
        </span>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-medium">{usuario.nombre}</p>
          <p className="text-xs text-muted-foreground">{usuario.rol}</p>
        </div>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-panel py-1.5 shadow-md"
        >
          <div className="border-b border-border px-3 pb-2">
            <p className="text-sm font-medium">{usuario.nombre}</p>
            <p className="text-xs text-muted-foreground">{usuario.rol}</p>
          </div>
          <button
            role="menuitem"
            onClick={toggle}
            className="flex w-full items-center gap-2 px-3 pt-2 text-sm hover:bg-accent-soft"
          >
            {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 pt-2 text-sm text-danger hover:bg-accent-soft"
          >
            <IconLogout className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { usuario } = useAuth();
  const pathname = usePathname();

  if (!usuario || pathname === '/inicio') return null;

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
        <Link
          href="/inicio"
          className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-accent-soft hover:text-foreground md:inline-flex"
        >
          <IconHome className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>

      <MenuUsuario />
    </header>
  );
}
