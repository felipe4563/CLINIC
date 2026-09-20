'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { GRUPOS_NAV } from '@/lib/navItems';
import { api } from '@/lib/api';
import { IconUserCircle, IconLogout, IconSun, IconMoon } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function logoSrc(logoUrl: string | null | undefined) {
  if (!logoUrl) return null;
  return logoUrl.startsWith('/uploads/') ? `${API_URL}${logoUrl}` : logoUrl;
}

type Icono = (p: { className?: string }) => React.JSX.Element;
type Tarjeta =
  | { tipo: 'link'; href: string; label: string; icon: Icono }
  | { tipo: 'accion'; label: string; icon: Icono; onClick: () => void; peligro?: boolean };

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function TarjetaModulo({ tarjeta }: { tarjeta: Tarjeta }) {
  const Icon = tarjeta.icon;
  const clases = `group flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-panel p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent lg:m-auto lg:h-28 lg:w-32 lg:p-3 ${
    tarjeta.tipo === 'accion' && tarjeta.peligro ? 'hover:border-danger/50' : 'hover:border-accent/50'
  }`;
  const colorIcono = tarjeta.tipo === 'accion' && tarjeta.peligro ? 'text-danger' : 'text-accent';

  const contenido = (
    <>
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft transition-transform duration-200 group-hover:scale-105 lg:h-10 lg:w-10 ${colorIcono}`}>
        <Icon className="h-6 w-6 lg:h-5 lg:w-5" />
      </span>
      <span className={`text-sm font-medium ${tarjeta.tipo === 'accion' && tarjeta.peligro ? 'text-danger' : 'text-foreground'}`}>
        {tarjeta.label}
      </span>
    </>
  );

  if (tarjeta.tipo === 'link') {
    return (
      <Link href={tarjeta.href} className={clases}>
        {contenido}
      </Link>
    );
  }

  return (
    <button type="button" onClick={tarjeta.onClick} className={clases}>
      {contenido}
    </button>
  );
}

export default function InicioPage() {
  const { usuario, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nombreClinica, setNombreClinica] = useState('Clinic NovagED');

  useEffect(() => {
    (async () => {
      try {
        const config = await api.getConfiguracionPublica();
        setLogoUrl(config.logo_url || null);
        if (config.nombre_consultorio) setNombreClinica(config.nombre_consultorio);
      } catch {
        /* usa los valores por defecto */
      }
    })();
  }, []);

  if (!usuario) return null;

  const modulos: Tarjeta[] = GRUPOS_NAV.flatMap((g) => g.items)
    .filter((item) => item.href !== '/inicio' && usuario.permisos?.includes(item.permiso))
    .map((item) => ({ tipo: 'link', href: item.href, label: item.label, icon: item.icon }));

  const tarjetas: Tarjeta[] = [
    ...modulos,
    { tipo: 'link', href: '/perfil', label: 'Mi perfil', icon: IconUserCircle },
    {
      tipo: 'accion',
      label: dark ? 'Modo claro' : 'Modo oscuro',
      icon: dark ? IconSun : IconMoon,
      onClick: toggle,
    },
    { tipo: 'accion', label: 'Cerrar sesión', icon: IconLogout, onClick: logout, peligro: true },
  ];

  const mitad = Math.ceil(tarjetas.length / 2);
  const izquierda = tarjetas.slice(0, mitad);
  const derecha = tarjetas.slice(mitad);
  const filasIzq = Math.ceil(izquierda.length / 2);
  const filasDer = Math.ceil(derecha.length / 2);

  return (
    <div className="relative min-h-screen overflow-hidden lg:h-screen">
      <div className="ambient-bg" aria-hidden>
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 select-none text-[26vw] font-bold leading-none text-accent/[0.08] lg:block"
      >
        {nombreClinica.charAt(0).toUpperCase()}
      </span>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-4 py-8 lg:h-full lg:flex-row lg:gap-4 lg:py-6 lg:px-6">
        <div
          className="grid-rows-dynamic-lg order-2 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:order-1 lg:h-full lg:flex-1 lg:grid-cols-2 lg:max-w-md lg:mx-auto lg:gap-1.5"
          style={{ '--filas': filasIzq } as React.CSSProperties}
        >
          {izquierda.map((tarjeta, i) => (
            <TarjetaModulo key={tarjeta.tipo === 'link' ? tarjeta.href : `accion-${i}`} tarjeta={tarjeta} />
          ))}
        </div>

        <div className="order-1 flex w-full shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-panel/90 p-10 text-center shadow-sm backdrop-blur-sm lg:order-2 lg:w-72 lg:self-center lg:gap-2 lg:p-6">
          {logoSrc(logoUrl) ? (
            <img
              src={logoSrc(logoUrl)!}
              alt={nombreClinica}
              className="h-20 w-20 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-semibold text-accent-foreground">
              {nombreClinica.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-lg font-semibold">{nombreClinica}</p>
            <p className="text-xs text-muted-foreground">Sistema interno</p>
          </div>
          <div className="mt-2 border-t border-border pt-3">
            <p className="text-sm text-muted-foreground">{saludo()},</p>
            <p className="font-medium">{usuario.nombre}</p>
          </div>
        </div>

        <div
          className="grid-rows-dynamic-lg order-3 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:h-full lg:flex-1 lg:grid-cols-2 lg:max-w-md lg:mx-auto lg:gap-1.5"
          style={{ '--filas': filasDer } as React.CSSProperties}
        >
          {derecha.map((tarjeta, i) => (
            <TarjetaModulo key={tarjeta.tipo === 'link' ? tarjeta.href : `accion-${i}`} tarjeta={tarjeta} />
          ))}
        </div>
      </div>
    </div>
  );
}
