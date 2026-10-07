'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { api } from '@/lib/api';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconSun,
  IconMoon,
  IconCalendar,
  IconUsers,
  IconCatalog,
  IconCruzMedica,
} from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const DESTACADOS = [
  { icon: IconCalendar, texto: 'Agenda diaria con vista de calendario' },
  { icon: IconUsers, texto: 'Historial y datos de cada paciente' },
  { icon: IconCatalog, texto: 'Servicios y profesionales de la clínica' },
];

function logoSrc(logoUrl: string | null | undefined) {
  if (!logoUrl) return null;
  return logoUrl.startsWith('/uploads/') ? `${API_URL}${logoUrl}` : logoUrl;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setEnviando(false);
    }
  }

  return (
    <div className="no-scrollbar fixed inset-0 flex items-center justify-center overflow-y-auto px-4 pb-24 pt-10 sm:px-6 sm:pb-16">
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
      </div>

      <div className="fixed bottom-4 right-4 z-20 flex items-center gap-2.5 sm:bottom-6 sm:right-8">
        <span className="hidden text-xs font-medium text-foreground/70 sm:inline">{dark ? 'Modo oscuro' : 'Modo claro'}</span>
        <button
          onClick={toggle}
          aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className={`relative flex h-6 w-11 items-center rounded-full border border-border transition-colors ${dark ? 'bg-accent' : 'bg-panel'}`}
        >
          <span
            className={`flex h-4.5 w-4.5 items-center justify-center rounded-full bg-panel text-accent shadow transition-transform ${dark ? 'translate-x-[22px]' : 'translate-x-1'}`}
          >
            {dark ? <IconMoon className="h-3 w-3" /> : <IconSun className="h-3 w-3" />}
          </span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoSrc(logoUrl) ? (
            <span className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-panel p-3 shadow-lg shadow-black/10">
              <img src={logoSrc(logoUrl)!} alt={nombreClinica} className="h-full w-full object-contain" />
            </span>
          ) : (
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg shadow-black/10"
              style={{ background: 'linear-gradient(135deg, var(--banner-from), var(--banner-to))' }}
            >
              <IconCruzMedica className="h-9 w-9" />
            </span>
          )}
          <span className="mt-3 text-xl font-semibold tracking-tight">{nombreClinica}</span>
          <span className="text-xs text-muted-foreground">Sistema interno de gestión</span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-panel/60 p-7 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:p-9">
          {enviando && (
            <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-accent/15">
              <div className="h-full w-1/3 animate-[login-progress_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
            </div>
          )}

          {enviando && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-panel/90 backdrop-blur-sm">
              <span className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
                <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
              </span>
              <p className="text-sm font-medium text-foreground">Verificando credenciales…</p>
            </div>
          )}

          <h2 className="text-center text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">Ingresa con tu cuenta del sistema interno.</p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3.5">
            <label className="block text-sm">
              <span className="sr-only">Email</span>
              <span className="relative flex items-center">
                <IconMail className="pointer-events-none absolute left-4 h-4 w-4 text-foreground/40" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="w-full rounded-full border border-border/70 bg-panel/70 py-2.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-accent"
                />
              </span>
            </label>

            <label className="block text-sm">
              <span className="sr-only">Contraseña</span>
              <span className="relative flex items-center">
                <IconLock className="pointer-events-none absolute left-4 h-4 w-4 text-foreground/40" />
                <input
                  type={verPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full rounded-full border border-border/70 bg-panel/70 py-2.5 pl-11 pr-11 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-4 text-foreground/40 hover:text-foreground/70"
                >
                  {verPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <p className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <IconAlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
              )}
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {DESTACADOS.map(({ icon: Icon, texto }) => (
            <li key={texto} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {texto}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Clinic NovagED. Uso interno.
        </p>
      </div>
    </div>
  );
}
