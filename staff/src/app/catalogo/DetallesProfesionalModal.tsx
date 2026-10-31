'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Profesional } from './ProfesionalItem';
import type { Servicio } from './ServicioItem';

// Servicios que atiende y horario de un profesional, en ventana (antes se abría
// dentro de la tarjeta y la estiraba hasta el fondo de la página).

type Horario = { id: number; dia_semana: number; hora_inicio: string; hora_fin: string };

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const input = 'rounded border border-border bg-panel px-2 py-1.5 text-sm';

export default function DetallesProfesionalModal({
  profesional,
  todosLosServicios,
  onClose,
  onCambio,
}: {
  profesional: Profesional;
  todosLosServicios: Servicio[];
  onClose: () => void;
  onCambio: () => void;
}) {
  const [horarios, setHorarios] = useState<Horario[] | null>(null);
  const [diaNuevo, setDiaNuevo] = useState('1');
  const [horaInicioNueva, setHoraInicioNueva] = useState('09:00');
  const [horaFinNueva, setHoraFinNueva] = useState('17:00');
  const [buscar, setBuscar] = useState('');
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState('');

  const asignados = new Set((profesional.Servicios || []).map((s) => s.id));
  const q = buscar.trim().toLowerCase();
  const visibles = todosLosServicios.filter((s) => !q || s.nombre.toLowerCase().includes(q));

  useEffect(() => {
    let vigente = true;
    api
      .getHorarios(profesional.id)
      .then((h: Horario[]) => vigente && setHorarios(h))
      .catch(() => vigente && setHorarios([]));
    return () => {
      vigente = false;
    };
  }, [profesional.id]);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  async function toggleServicio(servicioId: number) {
    setOcupado(servicioId);
    setError('');
    try {
      if (asignados.has(servicioId)) await api.desvincularServicio(profesional.id, servicioId);
      else await api.vincularServicio(profesional.id, servicioId);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setOcupado(null);
    }
  }

  async function agregarHorario(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const nuevo = await api.crearHorario(profesional.id, {
        dia_semana: Number(diaNuevo),
        hora_inicio: horaInicioNueva,
        hora_fin: horaFinNueva,
      });
      setHorarios((h) => [...(h || []), nuevo].sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el horario');
    }
  }

  async function eliminarHorario(id: number) {
    setError('');
    try {
      await api.eliminarHorario(id);
      setHorarios((h) => (h || []).filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar el horario');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalles de ${profesional.nombre}`}
        onClick={(e) => e.stopPropagation()}
        className="thin-scroll max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-panel p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Servicios y horario</h2>
            <p className="text-sm text-muted-foreground">{profesional.nombre}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <section className="mb-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Servicios que atiende <span className="font-normal normal-case tracking-normal">({asignados.size} de {todosLosServicios.length})</span>
            </p>
            {todosLosServicios.length > 8 && (
              <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar servicio…" className={`${input} w-full sm:w-56`} />
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">Toca un servicio para asignarlo o quitarlo.</p>
          <div className="flex flex-wrap gap-2">
            {visibles.map((s) => {
              const asignado = asignados.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={asignado}
                  disabled={ocupado === s.id}
                  onClick={() => toggleServicio(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                    asignado ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent'
                  }`}
                >
                  {asignado ? '✓ ' : ''}
                  {s.nombre}
                </button>
              );
            })}
            {todosLosServicios.length === 0 && <p className="text-xs text-muted-foreground">No hay servicios en el catálogo.</p>}
            {todosLosServicios.length > 0 && visibles.length === 0 && <p className="text-xs text-muted-foreground">Sin resultados.</p>}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Horario disponible</p>
          <div className="flex flex-col gap-1.5">
            {horarios === null && <p className="text-xs text-muted-foreground">Cargando…</p>}
            {horarios?.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <span>
                  {DIAS[h.dia_semana]} · {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
                </span>
                <button type="button" onClick={() => eliminarHorario(h.id)} className="text-xs text-danger hover:underline">
                  Quitar
                </button>
              </div>
            ))}
            {horarios?.length === 0 && <p className="text-xs text-muted-foreground">Sin horarios: no se puede reservar con este profesional.</p>}
          </div>

          <form onSubmit={agregarHorario} className="mt-3 flex flex-wrap items-center gap-2">
            <select value={diaNuevo} onChange={(e) => setDiaNuevo(e.target.value)} aria-label="Día" className={input}>
              {DIAS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <input type="time" value={horaInicioNueva} onChange={(e) => setHoraInicioNueva(e.target.value)} aria-label="Desde" className={input} />
            <span className="text-xs text-muted-foreground">a</span>
            <input type="time" value={horaFinNueva} onChange={(e) => setHoraFinNueva(e.target.value)} aria-label="Hasta" className={input} />
            <button type="submit" className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
              Agregar
            </button>
          </form>
        </section>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent-soft">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
