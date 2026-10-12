'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { IconArrowLeft } from '@/components/icons';
import ArchivoPrivado from '@/app/agenda/ArchivoPrivado';
import CampoHistoria, { type Grupo, type Valores } from './CampoHistoria';
import TablaTratamientos, { type FilaTratamiento } from './TablaTratamientos';

type Seccion = { clave: 'datos_clinicos' | 'datos_esteticos' | 'analisis_estetico'; titulo: string; grupos: Grupo[] };
type FilaProtocolo = { procedimiento: string; sesiones: string; comentario: string };
type Historia = {
  id: number;
  fecha: string;
  motivo_consulta: string | null;
  datos_clinicos: Valores;
  datos_esteticos: Valores;
  analisis_estetico: Valores;
  diagnostico: string | null;
  protocolo: FilaProtocolo[];
  procedimiento_autorizado: string | null;
  profesional_id: number | null;
  documento_firmado: string | null;
  updated_at?: string;
  updatedAt?: string;
  ActualizadoPor?: { nombre: string } | null;
  Paciente: { nombre_completo: string; codigo_paciente: string; carnet_identidad: string; carnet_expedido: string; fecha_nacimiento: string | null; telefono: string };
  tratamientos: { desde: string; hasta: string | null; filas: FilaTratamiento[] };
};

const CAMPOS_GUARDABLES = ['fecha', 'motivo_consulta', 'datos_clinicos', 'datos_esteticos', 'analisis_estetico', 'diagnostico', 'protocolo', 'procedimiento_autorizado', 'profesional_id'] as const;

export default function EditorHistoria() {
  const params = useParams<{ id: string; historiaId: string }>();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [profesionales, setProfesionales] = useState<{ id: number; nombre: string }[]>([]);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputFirmado = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const [def, h, pros] = await Promise.all([api.getDefinicionHistoria(), api.getHistoria(params.historiaId), api.getProfesionalesHistoria()]);
    setSecciones(def.secciones);
    setHistoria(h);
    setProfesionales(pros);
  }, [params.historiaId]);

  useEffect(() => {
    cargar().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la evaluación'));
  }, [cargar]);

  // Recarga solo la tabla de tratamientos sin perder lo que se está editando.
  async function recargarTratamientos() {
    const h = await api.getHistoria(params.historiaId);
    setHistoria((actual) => (actual ? { ...actual, tratamientos: h.tratamientos } : h));
  }

  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sucio]);

  function cambiar<K extends keyof Historia>(campo: K, valor: Historia[K]) {
    setHistoria((h) => (h ? { ...h, [campo]: valor } : h));
    setSucio(true);
    setAviso(null);
  }

  function cambiarEnSeccion(seccion: Seccion['clave'], clave: string, valor: string | boolean) {
    setHistoria((h) => (h ? { ...h, [seccion]: { ...h[seccion], [clave]: valor } } : h));
    setSucio(true);
    setAviso(null);
  }

  async function guardar() {
    if (!historia) return;
    setGuardando(true);
    setError(null);
    try {
      const datos = Object.fromEntries(CAMPOS_GUARDABLES.map((c) => [c, historia[c]]));
      const guardada = await api.guardarHistoria(historia.id, datos);
      setHistoria((h) => (h ? { ...guardada, tratamientos: h.tratamientos } : guardada));
      setSucio(false);
      setAviso('Cambios guardados.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function subirFirmado(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo || !historia) return;
    setError(null);
    try {
      const h = await api.subirDocumentoFirmado(historia.id, archivo);
      setHistoria((actual) => (actual ? { ...actual, documento_firmado: h.documento_firmado } : actual));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el documento');
    } finally {
      if (inputFirmado.current) inputFirmado.current.value = '';
    }
  }

  async function quitarFirmado() {
    if (!historia || !window.confirm('¿Quitar el documento firmado de esta evaluación?')) return;
    setError(null);
    try {
      const h = await api.quitarDocumentoFirmado(historia.id);
      setHistoria((actual) => (actual ? { ...actual, documento_firmado: h.documento_firmado } : actual));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar el documento');
    }
  }

  function cambiarProtocolo(i: number, campo: keyof FilaProtocolo, valor: string) {
    if (!historia) return;
    cambiar('protocolo', historia.protocolo.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
  }

  if (error && !historia) return <p className="text-sm text-danger">{error}</p>;
  if (!historia) return <p className="text-sm text-foreground/70">Cargando…</p>;

  const p = historia.Paciente;

  return (
    <div className="pb-10">
      <Link href={`/pacientes/${params.id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground">
        <IconArrowLeft className="h-4 w-4" />
        Volver a la ficha
      </Link>

      <div className="sticky top-16 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:bg-panel">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Historia clínica · {p.nombre_completo}</p>
          <p className="text-xs text-muted-foreground">
            N° {p.codigo_paciente}
            {historia.ActualizadoPor ? ` · Última edición: ${historia.ActualizadoPor.nombre}` : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sucio && <span className="text-xs text-stat-amber">Tienes cambios sin guardar</span>}
          {aviso && !sucio && <span className="text-xs text-stat-green">{aviso}</span>}
          <button onClick={() => api.descargarHistoriaPdf(historia.id)} disabled={sucio} title={sucio ? 'Guarda primero' : undefined} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">PDF</button>
          <button onClick={() => api.descargarHistoriaWord(historia.id)} disabled={sucio} title={sucio ? 'Guarda primero' : undefined} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">Word</button>
          <button onClick={guardar} disabled={guardando || !sucio} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60">
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3">
        <details open className="rounded-lg border border-border bg-panel p-4">
          <summary className="cursor-pointer text-base font-semibold">1. Datos personales</summary>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Nombre:</span> {p.nombre_completo}</p>
            <p><span className="text-muted-foreground">C.I.:</span> {p.carnet_identidad} {p.carnet_expedido}</p>
            <p><span className="text-muted-foreground">Teléfono:</span> {p.telefono}</p>
            <p><span className="text-muted-foreground">Nacimiento:</span> {p.fecha_nacimiento ?? '—'}</p>
          </div>
          <Link href={`/pacientes/${params.id}`} className="mt-2 inline-block text-xs text-accent hover:underline">Editar datos personales en la ficha</Link>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
            <label className="text-xs text-muted-foreground">
              Fecha de la evaluación
              <input type="date" value={historia.fecha} onChange={(e) => cambiar('fecha', e.target.value)} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
            </label>
            <label className="text-xs text-muted-foreground">
              Motivo de la consulta
              <textarea value={historia.motivo_consulta ?? ''} onChange={(e) => cambiar('motivo_consulta', e.target.value)} rows={2} maxLength={4000} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
            </label>
          </div>
        </details>

        {secciones.map((s) => (
          <details key={s.clave} className="rounded-lg border border-border bg-panel p-4">
            <summary className="cursor-pointer text-base font-semibold">{s.titulo}</summary>
            <div className="mt-3">
              {s.grupos.map((g) => (
                <CampoHistoria key={g.titulo} grupo={g} valores={historia[s.clave] || {}} onCambio={(clave, valor) => cambiarEnSeccion(s.clave, clave, valor)} />
              ))}
            </div>
          </details>
        ))}

        <details className="rounded-lg border border-border bg-panel p-4">
          <summary className="cursor-pointer text-base font-semibold">5. Diagnóstico y tratamiento estético</summary>
          <label className="mt-3 block text-xs text-muted-foreground">
            Diagnóstico
            <textarea value={historia.diagnostico ?? ''} onChange={(e) => cambiar('diagnostico', e.target.value)} rows={3} maxLength={4000} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
          </label>

          <p className="mb-1 mt-4 text-sm font-semibold">Protocolo estético seleccionado</p>
          <div className="flex flex-col gap-2">
            {historia.protocolo.map((f, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_100px_2fr_auto]">
                <input value={f.procedimiento} onChange={(e) => cambiarProtocolo(i, 'procedimiento', e.target.value)} placeholder="Procedimiento" aria-label="Procedimiento" maxLength={500} className="rounded border border-border px-2 py-1 text-sm" />
                <input value={f.sesiones} onChange={(e) => cambiarProtocolo(i, 'sesiones', e.target.value)} placeholder="Sesiones" aria-label="Sesiones" maxLength={500} className="rounded border border-border px-2 py-1 text-sm" />
                <input value={f.comentario} onChange={(e) => cambiarProtocolo(i, 'comentario', e.target.value)} placeholder="Comentario" aria-label="Comentario" maxLength={500} className="rounded border border-border px-2 py-1 text-sm" />
                <button type="button" onClick={() => cambiar('protocolo', historia.protocolo.filter((_, j) => j !== i))} aria-label="Quitar fila" className="rounded border border-border px-2 text-xs text-danger hover:bg-accent-soft">✕</button>
              </div>
            ))}
            {historia.protocolo.length < 20 && (
              <button type="button" onClick={() => cambiar('protocolo', [...historia.protocolo, { procedimiento: '', sesiones: '', comentario: '' }])} className="w-fit rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
                + Agregar procedimiento
              </button>
            )}
          </div>

          <p className="mb-1 mt-4 text-sm font-semibold">Tratamiento estético realizado</p>
          <TablaTratamientos pacienteId={params.id} filas={historia.tratamientos.filas} desde={historia.tratamientos.desde} onCambio={recargarTratamientos} />
        </details>

        <details className="rounded-lg border border-border bg-panel p-4">
          <summary className="cursor-pointer text-base font-semibold">6. Compromiso legal</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Especialista
              <select value={historia.profesional_id ?? ''} onChange={(e) => cambiar('profesional_id', e.target.value ? Number(e.target.value) : null)} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground">
                <option value="">—</option>
                {profesionales.map((pr) => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Procedimiento que se autoriza
              <input value={historia.procedimiento_autorizado ?? ''} onChange={(e) => cambiar('procedimiento_autorizado', e.target.value)} placeholder={historia.protocolo[0]?.procedimiento || ''} maxLength={255} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Descarga el PDF o el Word, imprímelo y fírmenlo. Después sube aquí la foto o el escaneo firmado.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={inputFirmado} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={subirFirmado} className="hidden" />
            <button type="button" onClick={() => inputFirmado.current?.click()} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
              {historia.documento_firmado ? 'Reemplazar documento firmado' : 'Subir documento firmado'}
            </button>
            {historia.documento_firmado && (
              <button type="button" onClick={quitarFirmado} className="rounded border border-border px-3 py-1.5 text-xs text-danger hover:bg-accent-soft">Quitar</button>
            )}
          </div>
          {historia.documento_firmado && (
            <div className="mt-3">
              <ArchivoPrivado key={historia.documento_firmado} ruta={`/staff/historias/${historia.id}/documento-firmado`} alt="Documento firmado" />
            </div>
          )}
        </details>
      </div>
    </div>
  );
}
