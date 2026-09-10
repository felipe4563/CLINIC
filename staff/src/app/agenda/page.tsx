'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import NuevaCitaModal from './NuevaCitaModal';
import DayAgendaCards, { Cita } from './DayAgendaCards';
import MonthCalendar from '@/components/MonthCalendar';

type Profesional = { id: number; nombre: string };

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(fecha: string, delta: number) {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function fmtFechaLarga(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function AgendaPage() {
  const [fecha, setFecha] = useState(hoy());
  const [profesionalId, setProfesionalId] = useState('');
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCitas(fecha, profesionalId || undefined);
      setCitas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [fecha, profesionalId]);

  useEffect(() => {
    api
      .getProfesionalesPublico()
      .then(setProfesionales)
      .catch(() => setProfesionales([]));
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  async function cambiarEstado(cita: Cita, estado: Cita['estado']) {
    try {
      await api.actualizarEstadoCita(cita.id, estado);
      cargarCitas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la cita');
    }
  }

  async function descargarPDF() {
    setDescargando(true);
    setError(null);
    try {
      await api.descargarAgendaPDF(fecha, profesionalId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el PDF');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-panel p-1">
            <button
              onClick={() => setFecha((f) => sumarDias(f, -1))}
              className="rounded p-1.5 hover:bg-accent-soft"
              aria-label="Día anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button onClick={() => setFecha(hoy())} className="rounded px-2 py-1 text-xs font-medium hover:bg-accent-soft">
              Hoy
            </button>
            <button
              onClick={() => setFecha((f) => sumarDias(f, 1))}
              className="rounded p-1.5 hover:bg-accent-soft"
              aria-label="Día siguiente"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <h1 className="text-lg font-semibold capitalize">{fmtFechaLarga(fecha)}</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={profesionalId}
            onChange={(e) => setProfesionalId(e.target.value)}
            className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm"
          >
            <option value="">Todos los profesionales</option>
            {profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={descargarPDF}
            disabled={descargando}
            className="flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium hover:bg-accent-soft disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {descargando ? 'Generando…' : 'Descargar PDF'}
          </button>
          <button
            onClick={() => setMostrarNueva(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <MonthCalendar fecha={fecha} profesionalId={profesionalId} onSelectDay={setFecha} />

        <div>
          {loading ? (
            <p className="mb-3 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <DayAgendaCards citas={citas} mostrarProfesional={!profesionalId} onEstadoChange={cambiarEstado} />
          )}
        </div>
      </div>

      {mostrarNueva && (
        <NuevaCitaModal
          iniciales={{ fecha }}
          onClose={() => setMostrarNueva(false)}
          onCreated={() => {
            setMostrarNueva(false);
            cargarCitas();
          }}
        />
      )}
    </div>
  );
}
