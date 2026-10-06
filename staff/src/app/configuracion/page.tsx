'use client';

import { useEffect, useState, useRef, FormEvent, ChangeEvent, ReactNode } from 'react';
import { api } from '@/lib/api';
import { IconSettings, IconMapPin, IconBuilding, IconMail, IconWallet } from '@/components/icons';

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
  cobra_adelanto_online: boolean;
  bs_por_punto: number;
  asistencia_lat: number | null;
  asistencia_lng: number | null;
  asistencia_radio_metros: number;
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
  cobra_adelanto_online: true,
  bs_por_punto: 10,
  asistencia_lat: null,
  asistencia_lng: null,
  asistencia_radio_metros: 150,
};

type CampoTexto = Exclude<
  keyof Config,
  'logo_url' | 'cobra_adelanto_online' | 'bs_por_punto' | 'asistencia_lat' | 'asistencia_lng' | 'asistencia_radio_metros'
>;

type Campo = { key: CampoTexto; label: string; placeholder?: string; span?: string; textarea?: boolean };

const CAMPOS_IDENTIDAD: Campo[] = [
  { key: 'nombre_consultorio', label: 'Nombre del consultorio' },
  { key: 'nit', label: 'NIT / Registro fiscal' },
  { key: 'direccion', label: 'Dirección', span: 'sm:col-span-2' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'pais', label: 'País' },
];

const CAMPOS_CONTACTO: Campo[] = [
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Correo electrónico' },
  { key: 'sitio_web', label: 'Sitio web', span: 'sm:col-span-2' },
];

function logoSrc(logoUrl: string | null) {
  if (!logoUrl) return null;
  return logoUrl.startsWith('/uploads/') ? `${API_URL}${logoUrl}` : logoUrl;
}

function Seccion({
  id,
  icono,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  icono: ReactNode;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-border bg-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        {icono}
        <h2 className="text-sm font-semibold">{titulo}</h2>
      </div>
      {descripcion && <p className="mb-4 text-xs text-muted-foreground">{descripcion}</p>}
      {children}
    </section>
  );
}

const SECCIONES_NAV = [
  { id: 'identidad', label: 'Identidad' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'facturacion', label: 'Facturación y fidelidad' },
  { id: 'asistencia', label: 'Asistencia' },
];

function CampoInput({ campo, form, onChange }: { campo: Campo; form: Config; onChange: (key: CampoTexto, value: string) => void }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${campo.span ?? ''}`}>
      <span className="text-xs font-medium text-muted-foreground">{campo.label}</span>
      {campo.textarea ? (
        <textarea
          value={form[campo.key] ?? ''}
          placeholder={campo.placeholder}
          onChange={(e) => onChange(campo.key, e.target.value)}
          rows={3}
          className="rounded-lg border border-border px-3 py-2"
        />
      ) : (
        <input
          value={form[campo.key] ?? ''}
          placeholder={campo.placeholder}
          required={campo.key === 'nombre_consultorio'}
          onChange={(e) => onChange(campo.key, e.target.value)}
          className="rounded-lg border border-border px-3 py-2"
        />
      )}
    </label>
  );
}

export default function ConfiguracionPage() {
  const [form, setForm] = useState<Config>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const inputLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getConfiguracion()
      .then((c: Config) => setForm({ ...VACIO, ...c }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setCargando(false));
  }, []);

  function setCampo(key: CampoTexto, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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

  function usarUbicacionActual() {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    setObteniendoUbicacion(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, asistencia_lat: pos.coords.latitude, asistencia_lng: pos.coords.longitude }));
        setObteniendoUbicacion(false);
      },
      () => {
        setError('No se pudo obtener tu ubicación actual');
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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

      <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-panel sm:px-4">
        {error && <p className="text-sm text-danger">{error}</p>}
        {guardado && <p className="text-sm text-stat-green">Cambios guardados.</p>}
        {!error && !guardado && <p className="text-sm text-muted-foreground">Los cambios se guardan juntos al final.</p>}
        <button
          type="submit"
          form="form-configuracion"
          disabled={guardando}
          className="ml-auto shrink-0 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <nav className="sticky top-[49px] z-10 -mx-4 mb-4 flex gap-1.5 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:flex-wrap sm:border-0 sm:bg-transparent sm:p-0">
        {SECCIONES_NAV.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-foreground/70 hover:bg-accent-soft hover:text-foreground"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <form id="form-configuracion" onSubmit={guardar} className="flex flex-col gap-4">
        <Seccion id="identidad" icono={<IconBuilding className="h-4 w-4 text-muted-foreground" />} titulo="Identidad del consultorio">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
              {logoSrc(form.logo_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc(form.logo_url)!} alt="Logo del consultorio" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">Sin logo</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Logo</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG. Máximo 3 MB. Se guarda al instante.</p>
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
                  <button
                    type="button"
                    onClick={quitarLogo}
                    disabled={subiendoLogo}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-60"
                  >
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAMPOS_IDENTIDAD.map((campo) => (
              <CampoInput key={campo.key} campo={campo} form={form} onChange={setCampo} />
            ))}
          </div>
        </Seccion>

        <Seccion id="contacto" icono={<IconMail className="h-4 w-4 text-muted-foreground" />} titulo="Contacto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAMPOS_CONTACTO.map((campo) => (
              <CampoInput key={campo.key} campo={campo} form={form} onChange={setCampo} />
            ))}
          </div>
        </Seccion>

        <Seccion id="facturacion" icono={<IconWallet className="h-4 w-4 text-muted-foreground" />} titulo="Facturación y fidelidad">
          <div className="flex flex-col gap-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.cobra_adelanto_online}
                onChange={(e) => setForm({ ...form, cobra_adelanto_online: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                <span className="block font-medium">Cobrar adelanto en reservas online</span>
                <span className="block text-xs text-muted-foreground">
                  Si lo desactivas, las reservas del sitio público se confirman directo, sin pedir pago por QR — el
                  paciente paga el total en la clínica.
                </span>
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
              <span className="font-medium">Bs. por cada punto de fidelidad</span>
              <span className="text-xs text-muted-foreground">
                Por cada este monto gastado (en citas completadas o ventas), el paciente gana 1 punto de fidelidad.
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.bs_por_punto}
                onChange={(e) => setForm({ ...form, bs_por_punto: Number(e.target.value) })}
                className="mt-1 rounded-lg border border-border px-3 py-2"
              />
            </label>

            <CampoInput
              campo={{ key: 'pie_pdf', label: 'Pie de página para PDFs', placeholder: 'Texto que aparece al final de reportes y exportaciones', textarea: true }}
              form={form}
              onChange={setCampo}
            />
          </div>
        </Seccion>

        <Seccion
          id="asistencia"
          icono={<IconMapPin className="h-4 w-4 text-muted-foreground" />}
          titulo="Asistencia: ubicación de la clínica"
          descripcion="El staff solo podrá marcar entrada/salida si está dentro de este radio de la clínica. Déjalo vacío para no validar ubicación."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Latitud</span>
              <input
                type="number"
                step="any"
                value={form.asistencia_lat ?? ''}
                onChange={(e) => setForm({ ...form, asistencia_lat: e.target.value === '' ? null : Number(e.target.value) })}
                className="rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Longitud</span>
              <input
                type="number"
                step="any"
                value={form.asistencia_lng ?? ''}
                onChange={(e) => setForm({ ...form, asistencia_lng: e.target.value === '' ? null : Number(e.target.value) })}
                className="rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Radio permitido (metros)</span>
              <input
                type="number"
                min="1"
                value={form.asistencia_radio_metros}
                onChange={(e) => setForm({ ...form, asistencia_radio_metros: Number(e.target.value) })}
                className="rounded-lg border border-border px-3 py-2"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={usarUbicacionActual}
            disabled={obteniendoUbicacion}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60"
          >
            {obteniendoUbicacion ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
          </button>
        </Seccion>
      </form>
    </div>
  );
}
