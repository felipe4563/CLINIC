'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';

type Paciente = { id: number; nombre_completo: string; telefono: string; codigo_paciente: string };
type Servicio = { id: number; nombre: string; precio: string };
type Profesional = { id: number; nombre: string };
type Slot = { hora_inicio: string; hora_fin: string };

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

type Iniciales = { fecha?: string; profesionalId?: number; horaSugerida?: string };

export default function NuevaCitaModal({
  onClose,
  onCreated,
  iniciales,
}: {
  onClose: () => void;
  onCreated: () => void;
  iniciales?: Iniciales;
}) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoCarnet, setNuevoCarnet] = useState('');
  const [nuevoExpedido, setNuevoExpedido] = useState('');

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState('');
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalId, setProfesionalId] = useState(iniciales?.profesionalId ? String(iniciales.profesionalId) : '');
  const [fecha, setFecha] = useState(iniciales?.fecha || hoy());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [pagada, setPagada] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.getServiciosPublico().then(setServicios).catch(() => setServicios([]));
  }, []);

  useEffect(() => {
    if (!servicioId) {
      setProfesionales([]);
      return;
    }
    api
      .getProfesionalesPublico(servicioId)
      .then((lista: Profesional[]) => {
        setProfesionales(lista);
        setProfesionalId((actual) => (lista.some((p) => String(p.id) === actual) ? actual : ''));
      })
      .catch(() => setProfesionales([]));
  }, [servicioId]);

  useEffect(() => {
    if (!servicioId || !profesionalId || !fecha) {
      setSlots([]);
      return;
    }
    api
      .getDisponibilidad(profesionalId, servicioId, fecha)
      .then((lista: Slot[]) => {
        setSlots(lista);
        const sugerida = iniciales?.horaSugerida;
        setHoraInicio(sugerida && lista.some((s) => s.hora_inicio === sugerida) ? sugerida : '');
      })
      .catch(() => setSlots([]));
  }, [servicioId, profesionalId, fecha]);

  const buscarPacientes = useCallback(async (texto: string) => {
    try {
      setResultados(await api.getPacientes(texto));
    } catch {
      setResultados([]);
    }
  }, []);

  useEffect(() => {
    buscarPacientes('');
  }, [buscarPacientes]);

  async function crearPacienteNuevo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const paciente = await api.crearPaciente({
        nombre_completo: nuevoNombre,
        telefono: nuevoTelefono,
        carnet_identidad: nuevoCarnet,
        carnet_expedido: nuevoExpedido,
      });
      setPacienteSeleccionado(paciente);
      setMostrarNuevoPaciente(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el paciente');
    }
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!pacienteSeleccionado || !servicioId || !profesionalId || !horaInicio) return;
    setError(null);
    setGuardando(true);
    try {
      await api.crearCita({
        pacienteId: pacienteSeleccionado.id,
        servicioId: Number(servicioId),
        profesionalId: Number(profesionalId),
        fecha,
        horaInicio,
        pagada,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cita');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nueva cita</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            Cerrar
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        {/* Paso 1: paciente */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium">Paciente</p>
          {pacienteSeleccionado ? (
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span>
                {pacienteSeleccionado.nombre_completo} · {pacienteSeleccionado.telefono}
              </span>
              <button onClick={() => setPacienteSeleccionado(null)} className="text-accent hover:underline">
                Cambiar
              </button>
            </div>
          ) : mostrarNuevoPaciente ? (
            <form onSubmit={crearPacienteNuevo} className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
              <input placeholder="Nombre completo" required value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="rounded border border-border px-2 py-1.5" />
              <input placeholder="Teléfono" required value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} className="rounded border border-border px-2 py-1.5" />
              <div className="flex gap-2">
                <input placeholder="Carnet" required value={nuevoCarnet} onChange={(e) => setNuevoCarnet(e.target.value)} className="w-1/2 rounded border border-border px-2 py-1.5" />
                <input placeholder="Expedido" required value={nuevoExpedido} onChange={(e) => setNuevoExpedido(e.target.value)} className="w-1/2 rounded border border-border px-2 py-1.5" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded bg-accent px-3 py-1.5 text-accent-foreground">Crear paciente</button>
                <button type="button" onClick={() => setMostrarNuevoPaciente(false)} className="rounded border border-border px-3 py-1.5">Cancelar</button>
              </div>
            </form>
          ) : (
            <div>
              <input
                type="search"
                placeholder="Buscar paciente por nombre, teléfono o carnet…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  buscarPacientes(e.target.value);
                }}
                className="mb-2 w-full rounded border border-border px-3 py-1.5 text-sm"
              />
              <div className="thin-scroll mb-2 flex max-h-36 flex-col gap-1 overflow-y-auto">
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPacienteSeleccionado(p)}
                    className="rounded border border-border px-2 py-1.5 text-left text-sm hover:bg-accent-soft"
                  >
                    {p.nombre_completo} · {p.telefono}
                  </button>
                ))}
                {resultados.length === 0 && <p className="text-xs text-muted-foreground">Sin resultados.</p>}
              </div>
              <button onClick={() => setMostrarNuevoPaciente(true)} className="text-sm text-accent hover:underline">
                + Crear paciente nuevo
              </button>
            </div>
          )}
        </div>

        {/* Paso 2: servicio / profesional / fecha / hora */}
        <form onSubmit={confirmar} className="flex flex-col gap-3">
          <label className="text-sm">
            Servicio
            <select required value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="mt-1 w-full rounded border border-border px-2 py-1.5">
              <option value="">Selecciona…</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · Bs {s.precio}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Profesional
            <select required disabled={!servicioId} value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)} className="mt-1 w-full rounded border border-border px-2 py-1.5 disabled:opacity-50">
              <option value="">Selecciona…</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Fecha
            <input type="date" required min={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded border border-border px-2 py-1.5" />
          </label>

          <div className="text-sm">
            Horario disponible
            <div className="mt-1 flex flex-wrap gap-2">
              {slots.length === 0 && <p className="text-xs text-muted-foreground">Selecciona servicio, profesional y fecha.</p>}
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.hora_inicio}
                  onClick={() => setHoraInicio(s.hora_inicio)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    horaInicio === s.hora_inicio ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'
                  }`}
                >
                  {s.hora_inicio}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pagada} onChange={(e) => setPagada(e.target.checked)} />
            Ya fue pagada (marcar como confirmada)
          </label>

          <button
            type="submit"
            disabled={guardando || !pacienteSeleccionado || !horaInicio}
            className="mt-1 rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {guardando ? 'Creando…' : 'Crear cita'}
          </button>
        </form>
      </div>
    </div>
  );
}
