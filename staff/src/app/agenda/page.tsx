'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import NuevaCitaModal from './NuevaCitaModal';
import DayAgendaCards, { Cita, AccionCita } from './DayAgendaCards';
import ComprobanteModal from './ComprobanteModal';
import JustificacionModal from './JustificacionModal';
import ReprogramarModal from './ReprogramarModal';
import ArchivoPrivado from './ArchivoPrivado';
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
  const [porRevisar, setPorRevisar] = useState<Cita[]>([]);
  const [verPorRevisar, setVerPorRevisar] = useState(false);
  // Si ya no quedan comprobantes, se vuelve solo a la agenda del día.
  const viendoPorRevisar = verPorRevisar && porRevisar.length > 0;
  const [modal, setModal] = useState<{ cita: Cita; accion: AccionCita } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargarPorRevisar = useCallback(async () => {
    try {
      setPorRevisar(await api.getCitasPorRevisar());
    } catch {
      setPorRevisar([]);
    }
  }, []);

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

  useEffect(() => {
    cargarPorRevisar();
  }, [cargarPorRevisar]);

  function recargarTodo(textoAviso: string | null = null) {
    setAviso(textoAviso);
    cargarCitas();
    cargarPorRevisar();
  }

  async function cambiarEstado(cita: Cita, estado: Cita['estado']) {
    try {
      const actualizada = await api.actualizarEstadoCita(cita.id, estado);
      const sello = actualizada?.sello as { servicio: string; sellos: number; requeridos: number; premio: boolean } | null;
      recargarTodo(
        sello
          ? sello.premio
            ? `🎁 ${cita.Paciente.nombre_completo} completó su tarjeta de ${sello.servicio}: ganó una sesión gratis.`
            : `Sello sumado a ${cita.Paciente.nombre_completo}: ${sello.servicio} ${sello.sellos}/${sello.requeridos}.`
          : null,
      );
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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-panel p-1">
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
          <h1 className="min-w-0 truncate text-base font-semibold capitalize sm:text-lg">{fmtFechaLarga(fecha)}</h1>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <select
            value={profesionalId}
            onChange={(e) => setProfesionalId(e.target.value)}
            className="col-span-2 w-full min-w-0 rounded-lg border border-border bg-panel px-3 py-2 text-sm sm:w-auto sm:py-1.5"
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
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium hover:bg-accent-soft disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {descargando ? (
              'Generando…'
            ) : (
              <>
                <span className="sm:hidden">PDF</span>
                <span className="hidden sm:inline">Descargar PDF</span>
              </>
            )}
          </button>
          <button
            onClick={() => setMostrarNueva(true)}
            className="whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {porRevisar.length > 0 && (
        <button type="button" onClick={() => setVerPorRevisar((v) => !v)} className="mb-4 flex w-full items-center justify-between rounded-xl border border-stat-amber bg-stat-amber-soft px-4 py-3 text-left text-sm text-stat-amber">
          <span className="font-medium">{porRevisar.length} {porRevisar.length === 1 ? 'comprobante por revisar' : 'comprobantes por revisar'}</span>
          <span className="text-xs">{viendoPorRevisar ? 'Volver a la agenda del día' : 'Ver todos'}</span>
        </button>
      )}
      {aviso && <p className="mb-4 rounded-lg border border-stat-amber px-3 py-2 text-sm text-stat-amber">{aviso}</p>}
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <MonthCalendar fecha={fecha} profesionalId={profesionalId} onSelectDay={setFecha} />

        <div>
          {loading ? (
            <p className="mb-3 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <DayAgendaCards
              citas={viendoPorRevisar ? porRevisar : citas}
              mostrarProfesional={!profesionalId}
              onEstadoChange={cambiarEstado}
              onAccion={(cita, accion) => setModal({ cita, accion })}
              mostrarFecha={viendoPorRevisar}
            />
          )}
        </div>
      </div>

      {mostrarNueva && (
        <NuevaCitaModal
          iniciales={{ fecha }}
          onClose={() => setMostrarNueva(false)}
          onCreated={() => {
            setMostrarNueva(false);
            recargarTodo();
          }}
        />
      )}

      {modal?.accion === 'comprobante' && <ComprobanteModal cita={modal.cita} onClose={() => setModal(null)} onCambio={recargarTodo} />}
      {modal?.accion === 'justificar' && <JustificacionModal cita={modal.cita} onClose={() => setModal(null)} onCambio={() => recargarTodo()} />}
      {modal?.accion === 'reprogramar' && <ReprogramarModal cita={modal.cita} onClose={() => setModal(null)} onCambio={recargarTodo} />}
      {modal?.accion === 'verJustificacion' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div role="dialog" aria-modal="true" aria-label="Prueba de la justificación" onClick={(e) => e.stopPropagation()} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
            <div className="mb-3 flex justify-between"><h2 className="text-base font-semibold">Prueba de la justificación</h2><button onClick={() => setModal(null)} aria-label="Cerrar">✕</button></div>
            <ArchivoPrivado ruta={`/staff/citas/${modal.cita.id}/justificacion`} alt="Prueba de la justificación" />
          </div>
        </div>
      )}
    </div>
  );
}
