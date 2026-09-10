'use client';

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from 'react';
import { api } from '@/lib/api';
import { IconSettings } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type Config = {
  nombre_consultorio: string;
  nit: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  logo_url: string | null;
  pie_pdf: string | null;
};

const VACIO: Config = {
  nombre_consultorio: '',
  nit: '',
  direccion: '',
  ciudad: '',
  pais: '',
  telefono: '',
  email: '',
  sitio_web: '',
  logo_url: '',
  pie_pdf: '',
};

const CAMPOS: { key: keyof Config; label: string; placeholder?: string; span?: string; textarea?: boolean }[] = [
  { key: 'nombre_consultorio', label: 'Nombre del consultorio' },
  { key: 'nit', label: 'NIT / Registro fiscal' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'pais', label: 'País' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Correo electrónico' },
  { key: 'sitio_web', label: 'Sitio web' },
  { key: 'pie_pdf', label: 'Pie de página para PDFs', placeholder: 'Texto que aparece al final de reportes y exportaciones', span: 'sm:col-span-2', textarea: true },
];

function logoSrc(logoUrl: string | null) {
  if (!logoUrl) return null;
  return logoUrl.startsWith('/uploads/') ? `${API_URL}${logoUrl}` : logoUrl;
}

export default function ConfiguracionPage() {
  const [form, setForm] = useState<Config>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const inputLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getConfiguracion()
      .then((c: Config) => setForm({ ...VACIO, ...c }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setCargando(false));
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setGuardado(false);
    try {
      const actualizado = await api.actualizarConfiguracion(form);
      setForm({ ...VACIO, ...actualizado });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function subirLogo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoLogo(true);
    setError(null);
    try {
      const actualizado = await api.subirLogoConfiguracion(archivo);
      setForm({ ...VACIO, ...actualizado });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el logo');
    } finally {
      setSubiendoLogo(false);
      if (inputLogoRef.current) inputLogoRef.current.value = '';
    }
  }

  async function quitarLogo() {
    if (!window.confirm('¿Quitar el logo del consultorio?')) return;
    setSubiendoLogo(true);
    setError(null);
    try {
      const actualizado = await api.eliminarLogoConfiguracion();
      setForm({ ...VACIO, ...actualizado });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar el logo');
    } finally {
      setSubiendoLogo(false);
    }
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <IconSettings className="h-5 w-5 text-muted-foreground" />
        Configuración
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Datos del consultorio. Se usan como referencia en reportes y exportaciones (por ejemplo, PDFs).
      </p>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {guardado && <p className="mb-3 text-sm text-stat-green">Cambios guardados.</p>}

      <div className="mb-4 flex items-center gap-4 rounded-xl border border-border bg-panel p-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {logoSrc(form.logo_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc(form.logo_url)!} alt="Logo del consultorio" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Sin logo</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Logo del consultorio</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG. Máximo 3 MB.</p>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => inputLogoRef.current?.click()}
              disabled={subiendoLogo}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60"
            >
              {subiendoLogo ? 'Subiendo…' : form.logo_url ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            {form.logo_url && (
              <button type="button" onClick={quitarLogo} disabled={subiendoLogo} className="rounded-lg border border-border px-3 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-60">
                Quitar
              </button>
            )}
          </div>
          <input
            ref={inputLogoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={subirLogo}
            className="hidden"
          />
        </div>
      </div>

      <form onSubmit={guardar} className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-panel p-5 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <label key={campo.key} className={`flex flex-col gap-1 text-sm ${campo.span ?? ''}`}>
            <span className="text-xs font-medium text-muted-foreground">{campo.label}</span>
            {campo.textarea ? (
              <textarea
                value={form[campo.key] ?? ''}
                placeholder={campo.placeholder}
                onChange={(e) => setForm({ ...form, [campo.key]: e.target.value })}
                rows={3}
                className="rounded-lg border border-border px-3 py-2"
              />
            ) : (
              <input
                value={form[campo.key] ?? ''}
                placeholder={campo.placeholder}
                required={campo.key === 'nombre_consultorio'}
                onChange={(e) => setForm({ ...form, [campo.key]: e.target.value })}
                className="rounded-lg border border-border px-3 py-2"
              />
            )}
          </label>
        ))}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
