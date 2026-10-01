'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { GRUPOS_NAV } from '@/lib/navItems';
import { api } from '@/lib/api';
import { IconUserCircle, IconLogout, IconSun, IconMoon, IconHeart, IconSparkle, IconCruzMedica } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function IconDrop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5C12 2.5 5.5 11.5 5.5 15.5a6.5 6.5 0 0 0 13 0c0-4-6.5-13-6.5-13Z" />
      <path d="M8.5 15.5a3.5 3.5 0 0 0 3.5 3.5" />
    </svg>
  );
}

function IconLeaf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4c-9 0-15 5-15 14 9 0 14-6 14-14Z" />
      <path d="M5 18C10 13 14 10 19.5 4.5" />
    </svg>
  );
}

const AMBIENT_ICONS: { Icon: Icono; style: React.CSSProperties; size: string }[] = [
  { Icon: IconLeaf, style: { left: '3vw', top: '26vh', animationDelay: '0s', animationDuration: '11s' }, size: 'h-7 w-7' },
  { Icon: IconDrop, style: { left: '5vw', top: '62vh', animationDelay: '1.5s', animationDuration: '9s' }, size: 'h-6 w-6' },
  { Icon: IconSparkle, style: { right: '5vw', top: '38vh', animationDelay: '0.8s', animationDuration: '10s' }, size: 'h-6 w-6' },
  { Icon: IconHeart, style: { right: '4vw', top: '68vh', animationDelay: '2.2s', animationDuration: '12s' }, size: 'h-6 w-6' },
];

function logoSrc(logoUrl: string | null | undefined) {
  if (!logoUrl) return null;
  return logoUrl.startsWith('/uploads/') ? `${API_URL}${logoUrl}` : logoUrl;
}

type Icono = (p: { className?: string }) => React.JSX.Element;
type Insignia = { texto: string; tono: 'accent' | 'danger' };
type Grupo = 'operacion' | 'administracion';
type ResumenDashboard = {
  citasHoy: number;
  pacientesTotal: number | null;
  saldosPendientes: { cantidad: number; total: number };
  inventario: { stockBajo: number; porVencer: number } | null;
};
type Tarjeta =
  | { tipo: 'link'; href: string; label: string; icon: Icono; badge?: Insignia; grupo?: Grupo }
  | { tipo: 'accion'; label: string; icon: Icono; onClick: () => void; peligro?: boolean };

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function MiniCalendario() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diaHoy = hoy.getDate();
  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7; // 0 = lunes
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-1 w-full rounded-xl border border-border/60 bg-background/40 p-2.5 text-center">
      <p className="mb-1.5 text-[11px] font-medium capitalize text-muted-foreground">
        {hoy.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-y-1 text-[10px]">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="text-muted-foreground/70">
            {d}
          </span>
        ))}
        {celdas.map((dia, i) => (
          <span
            key={i}
            className={
              dia === diaHoy
                ? 'mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground'
                : 'flex h-5 w-5 items-center justify-center text-foreground/80'
            }
          >
            {dia ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function InsigniaTarjeta({ badge, solida }: { badge: Insignia; solida: boolean }) {
  const tono = solida
    ? 'border-white/50 bg-white text-[#2a2118]'
    : badge.tono === 'danger'
      ? 'border-danger/30 bg-danger text-white'
      : 'border-accent/30 bg-accent text-accent-foreground';
  return (
    <span
      className={`absolute -right-1.5 -top-1.5 z-10 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none shadow-sm ${tono}`}
    >
      {badge.texto}
    </span>
  );
}

const ESTILO_GRUPO: Record<Grupo, string> = {
  operacion: 'bg-group-operacion text-group-operacion-foreground border-transparent',
  administracion: 'bg-group-administracion text-group-administracion-foreground border-transparent',
};

function TarjetaModulo({ tarjeta }: { tarjeta: Tarjeta }) {
  const Icon = tarjeta.icon;
  const grupo = tarjeta.tipo === 'link' ? tarjeta.grupo : undefined;
  const clases = `group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent lg:m-auto lg:h-28 lg:w-32 lg:p-3 ${
    grupo
      ? ESTILO_GRUPO[grupo]
      : `border-border bg-panel ${tarjeta.tipo === 'accion' && tarjeta.peligro ? 'hover:border-danger/50' : 'hover:border-accent/50'}`
  }`;
  const colorIcono = grupo
    ? ''
    : tarjeta.tipo === 'accion' && tarjeta.peligro
      ? 'text-danger'
      : 'text-accent';
  const iconoBg = grupo ? 'bg-white/15' : 'bg-accent-soft';
  const badge = tarjeta.tipo === 'link' ? tarjeta.badge : undefined;

  const contenido = (
    <>
      {badge && <InsigniaTarjeta badge={badge} solida={!!grupo} />}
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 lg:h-10 lg:w-10 ${iconoBg} ${colorIcono}`}>
        <Icon className="h-6 w-6 lg:h-5 lg:w-5" />
      </span>
      <span className={`text-sm font-medium ${grupo ? '' : tarjeta.tipo === 'accion' && tarjeta.peligro ? 'text-danger' : 'text-foreground'}`}>
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
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);

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
    (async () => {
      try {
        setResumen(await api.getDashboard('dia'));
      } catch {
        /* las tarjetas se muestran sin insignias */
      }
    })();
  }, []);

  if (!usuario) return null;

  const badges: Record<string, Insignia | undefined> = resumen
    ? {
        '/agenda': resumen.citasHoy > 0 ? { texto: `${resumen.citasHoy} hoy`, tono: 'accent' } : undefined,
        '/pacientes':
          resumen.pacientesTotal != null ? { texto: `${resumen.pacientesTotal}`, tono: 'accent' } : undefined,
        '/inventario':
          resumen.inventario && resumen.inventario.stockBajo > 0
            ? { texto: 'Stock bajo', tono: 'danger' }
            : undefined,
        '/saldos':
          resumen.saldosPendientes.cantidad > 0
            ? { texto: `${resumen.saldosPendientes.cantidad} pend.`, tono: 'danger' }
            : undefined,
      }
    : {};

  const grupoDe = (etiqueta: string): Grupo | undefined => {
    if (etiqueta === 'Operación') return 'operacion';
    if (etiqueta === 'Administración') return 'administracion';
    return undefined;
  };

  const modulos: Tarjeta[] = GRUPOS_NAV.flatMap((g) => g.items.map((item) => ({ ...item, grupo: grupoDe(g.label) })))
    .filter((item) => item.href !== '/inicio' && usuario.permisos?.includes(item.permiso))
    .map((item) => ({
      tipo: 'link',
      href: item.href,
      label: item.label,
      icon: item.icon,
      badge: badges[item.href],
      grupo: item.grupo,
    }));

  const tarjetas: Tarjeta[] = [
    ...modulos,
    { tipo: 'link', href: '/perfil', label: 'Mi perfil', icon: IconUserCircle, grupo: 'administracion' },
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <Image
          src="/images/login-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover blur-[3px]"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--background) 45%, transparent), color-mix(in srgb, var(--background) 65%, transparent))',
        }}
      />

      <div className="ambient-bg" aria-hidden style={{ background: 'transparent' }}>
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />

        <svg
          className="ambient-lineart ambient-lineart-1"
          viewBox="0 0 300 300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M20 260C70 230 60 170 100 150C140 130 150 80 130 30" />
          <path d="M100 150C130 160 165 145 175 110" />
          <path d="M60 200C85 205 105 195 115 175" />
          <circle cx="130" cy="30" r="5" />
        </svg>

        <svg
          className="ambient-lineart ambient-lineart-2"
          viewBox="0 0 220 220"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M15 40C60 20 100 45 110 90C120 135 165 155 200 140" />
          <path d="M110 90C90 100 70 95 55 78" />
          <circle cx="200" cy="140" r="4.5" />
          <circle cx="15" cy="40" r="4.5" />
        </svg>

        {AMBIENT_ICONS.map(({ Icon, style, size }, i) => (
          <span key={i} className="ambient-icon" style={style}>
            <Icon className={size} />
          </span>
        ))}
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

        <div className="order-1 flex w-full shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-panel/90 p-10 text-center shadow-sm backdrop-blur-sm lg:order-2 lg:w-72 lg:self-center lg:gap-1.5 lg:p-5">
          {logoSrc(logoUrl) ? (
            <img
              src={logoSrc(logoUrl)!}
              alt={nombreClinica}
              className="h-20 w-20 rounded-full border border-border object-cover lg:h-16 lg:w-16"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground lg:h-16 lg:w-16">
              <IconCruzMedica className="h-9 w-9 lg:h-7 lg:w-7" />
            </span>
          )}
          <div>
            <p className="text-lg font-semibold">{nombreClinica}</p>
            <p className="text-xs text-muted-foreground">Sistema interno</p>
          </div>
          <div className="mt-2 w-full border-t border-border pt-3">
            <p className="text-sm text-muted-foreground">{saludo()},</p>
            <p className="font-medium">{usuario.nombre}</p>
          </div>
          <MiniCalendario />
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
