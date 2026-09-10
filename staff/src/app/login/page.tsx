'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
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
} from '@/components/icons';

const DESTACADOS = [
  { icon: IconCalendar, texto: 'Agenda diaria con vista de calendario' },
  { icon: IconUsers, texto: 'Historial y datos de cada paciente' },
  { icon: IconCatalog, texto: 'Catálogo de servicios y profesionales' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="no-scrollbar fixed inset-0 flex items-center justify-center overflow-y-auto px-4 py-10 sm:px-6">
      <div className="login-bg" aria-hidden>
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
      </div>

      <button
        onClick={toggle}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="fixed right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-border bg-panel/70 px-3 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-md transition-colors hover:bg-accent-soft sm:right-8 sm:top-8"
      >
        {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
        <span className="hidden sm:inline">{dark ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white shadow-lg shadow-black/10"
            style={{ background: 'linear-gradient(135deg, var(--banner-from), var(--banner-to))' }}
          >
            N
          </span>
          <span className="mt-3 text-lg font-semibold tracking-tight">Clinic NovagED</span>
          <span className="text-xs text-muted-foreground">Sistema interno de gestión</span>
        </div>

        <div className="rounded-2xl border border-border bg-panel/75 p-7 shadow-2xl shadow-black/5 backdrop-blur-xl sm:p-9">
          <h2 className="text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Ingresa con tu cuenta del sistema interno.</p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground/80">Email</span>
              <span className="relative flex items-center">
                <IconMail className="pointer-events-none absolute left-3 h-4 w-4 text-foreground/40" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@clinicnovaged.com"
                  className="w-full rounded-lg border border-border bg-panel py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-accent"
                />
              </span>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground/80">Contraseña</span>
              <span className="relative flex items-center">
                <IconLock className="pointer-events-none absolute left-3 h-4 w-4 text-foreground/40" />
                <input
                  type={verPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-panel py-2.5 pl-9 pr-10 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 text-foreground/40 hover:text-foreground/70"
                >
                  {verPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <p className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <IconAlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
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
