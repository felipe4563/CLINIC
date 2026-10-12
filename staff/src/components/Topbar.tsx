'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { IconMenu, IconSun, IconMoon, IconLogout, IconHome, IconCard } from './icons';
import PasarTarjetaModal from './tarjeta/PasarTarjetaModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function avatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  return avatarUrl.startsWith('/uploads/') ? `${API_URL}${avatarUrl}` : avatarUrl;
}

function MenuUsuario() {
  const { usuario, logout } = useAuth();
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

  const src = avatarSrc(usuario.avatar_url);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de usuario"
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent-soft"
      >
        {src ? (
          <img src={src} alt={usuario.nombre} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {iniciales(usuario.nombre)}
          </span>
        )}
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
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex w-full items-center gap-2 px-3 pt-2 text-sm hover:bg-accent-soft"
          >
            Mi perfil
          </Link>
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

// Un lector USB "tipo teclado" escribe el número de la tarjeta y Enter en
// milisegundos. Si eso pasa sin un campo de texto enfocado, se abre la tarjeta
// desde cualquier pantalla; la escritura de una persona es mucho más lenta.
const MAX_MS_ENTRE_TECLAS = 50;
const MIN_LARGO_UID = 6;

function BotonTarjeta() {
  const [abierto, setAbierto] = useState(false);
  const [uidLeido, setUidLeido] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) return;
    let buffer = '';
    let ultima = 0;
    function alTeclear(e: KeyboardEvent) {
      const destino = e.target as HTMLElement | null;
      if (destino && (destino.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName))) return;
      const ahora = Date.now();
      if (ahora - ultima > MAX_MS_ENTRE_TECLAS) buffer = '';
      ultima = ahora;
      if (e.key === 'Enter') {
        if (buffer.length >= MIN_LARGO_UID) {
          e.preventDefault();
          setUidLeido(buffer);
          setAbierto(true);
        }
        buffer = '';
      } else if (e.key.length === 1 && /[0-9a-z:]/i.test(e.key)) {
        buffer += e.key;
      }
    }
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  return (
    <>
      <button
        onClick={() => {
          setUidLeido(null);
          setAbierto(true);
        }}
        aria-label="Pasar tarjeta"
        title="Pasar tarjeta de fidelización"
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-foreground/70 hover:bg-accent-soft hover:text-foreground"
      >
        <IconCard className="h-5 w-5" />
        <span className="hidden lg:inline">Pasar tarjeta</span>
      </button>
      {abierto && <PasarTarjetaModal uidInicial={uidLeido} onClose={() => setAbierto(false)} />}
    </>
  );
}

function BotonTema() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className="rounded-lg p-2 text-foreground/70 hover:bg-accent-soft hover:text-foreground"
    >
      {dark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
    </button>
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

      <div className="flex items-center gap-2">
        {usuario.permisos?.includes('pacientes') && <BotonTarjeta />}
        <BotonTema />
        <MenuUsuario />
      </div>
    </header>
  );
}
