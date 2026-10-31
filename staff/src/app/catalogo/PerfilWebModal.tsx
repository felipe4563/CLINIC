'use client';

import { useRef, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { fotoSrc, type Profesional } from './ProfesionalItem';

type Linea = { titulo: string; detalle: string };

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO = 5 * 1024 * 1024;

// Lo que la página web muestra del profesional: la sección "Nuestro equipo" del
// inicio y su propia página /equipo/<slug>.
export default function PerfilWebModal({
  profesional,
  onClose,
  onCambio,
}: {
  profesional: Profesional;
  onClose: () => void;
  onCambio: () => void;
}) {
  const [cargo, setCargo] = useState(profesional.cargo || '');
  const [biografia, setBiografia] = useState(profesional.biografia || '');
  const [formacion, setFormacion] = useState<Linea[]>(
    profesional.formacion?.length ? profesional.formacion : [{ titulo: '', detalle: '' }],
  );
  const [mostrar, setMostrar] = useState(Boolean(profesional.mostrar_en_web));
  const [orden, setOrden] = useState(String(profesional.orden_web ?? 0));
  const [foto, setFoto] = useState(profesional.foto_url);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const inputFoto = useRef<HTMLInputElement>(null);

  function cambiarLinea(i: number, campo: keyof Linea, valor: string) {
    setFormacion((l) => l.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type) || archivo.size > MAX_FOTO) {
      setError('La foto debe ser JPG, PNG o WEBP de hasta 5 MB');
      return;
    }
    setSubiendo(true);
    setError('');
    try {
      const actualizado = await api.subirFotoProfesional(profesional.id, archivo);
      setFoto(actualizado.foto_url);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  }

  async function quitarFoto() {
    setSubiendo(true);
    setError('');
    try {
      await api.eliminarFotoProfesional(profesional.id);
      setFoto(null);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la foto');
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (mostrar && !biografia.trim()) {
      setError('Para mostrarlo en la web primero escribe su biografía');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api.actualizarProfesional(profesional.id, {
        cargo,
        biografia,
        formacion: formacion.filter((l) => l.titulo.trim() || l.detalle.trim()),
        orden_web: Number(orden) || 0,
        mostrar_en_web: mostrar,
      });
      onCambio();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  const src = fotoSrc(foto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Perfil en la página web"
        onClick={(e) => e.stopPropagation()}
        onSubmit={guardar}
        className="thin-scroll max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-panel p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Perfil en la página web</h2>
            <p className="text-sm text-muted-foreground">
              {profesional.nombre}
              {profesional.slug ? ` · su página: /equipo/${profesional.slug}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
          <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
          <span>
            <span className="font-medium">Mostrar en la web</span>
            <span className="block text-xs text-muted-foreground">
              Aparece en &quot;Nuestro equipo&quot; y tiene su propia página. Necesita la biografía escrita.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-t-full rounded-b-lg border border-border bg-background">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={`Foto de ${profesional.nombre}`} className="h-full w-full object-cover object-top" />
            ) : (
              <span className="px-1 text-center text-[11px] text-muted-foreground">Sin foto</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Foto</p>
            <p className="text-xs text-muted-foreground">JPG, PNG o WEBP, máximo 5 MB. Mejor vertical, de frente. Se guarda al instante.</p>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => inputFoto.current?.click()}
                disabled={subiendo}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60"
              >
                {subiendo ? 'Subiendo…' : foto ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {foto && (
                <button
                  type="button"
                  onClick={quitarFoto}
                  disabled={subiendo}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-60"
                >
                  Quitar
                </button>
              )}
            </div>
            <input ref={inputFoto} type="file" accept="image/png,image/jpeg,image/webp" onChange={subirFoto} className="hidden" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
          <label className="flex flex-col gap-1 text-sm">
            Cargo corto
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              maxLength={255}
              placeholder="Ej. Licenciada en Fisioterapia"
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Orden
            <input
              type="number"
              min={0}
              max={999}
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">El orden más bajo sale primero y en grande.</p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          Biografía
          <textarea
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
            rows={6}
            placeholder="Quién es, qué atiende y cómo trabaja. Deja una línea en blanco para separar párrafos."
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm">Formación y credenciales</legend>
          <div className="mt-2 flex flex-col gap-2">
            {formacion.map((l, i) => (
              <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                <input
                  value={l.titulo}
                  onChange={(e) => cambiarLinea(i, 'titulo', e.target.value)}
                  maxLength={120}
                  placeholder="Ej. SEDES"
                  aria-label={`Título ${i + 1}`}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-auto sm:min-w-0 sm:flex-1"
                />
                <input
                  value={l.detalle}
                  onChange={(e) => cambiarLinea(i, 'detalle', e.target.value)}
                  maxLength={200}
                  placeholder="Ej. Matriculada, Cochabamba"
                  aria-label={`Detalle ${i + 1}`}
                  className="min-w-0 flex-[2] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFormacion((x) => x.filter((_, j) => j !== i))}
                  className="rounded-lg border border-border px-3 text-xs text-danger hover:bg-danger/10"
                  aria-label={`Quitar línea ${i + 1}`}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          {formacion.length < 20 && (
            <button
              type="button"
              onClick={() => setFormacion((x) => [...x, { titulo: '', detalle: '' }])}
              className="mt-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              + Agregar línea
            </button>
          )}
        </fieldset>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={guardando || subiendo} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar perfil'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
