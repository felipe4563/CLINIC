'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import TratamientoItem, { type NotaClinica } from './TratamientoItem';

type Cita = {
  id: number;
  fecha: string;
  hora_inicio: string;
  estado: string;
  Profesional: { nombre: string };
  Servicio: { nombre: string };
};

type Paciente = {
  id: number;
  codigo_paciente: string;
  nombre_completo: string;
  telefono: string;
  carnet_identidad: string;
  carnet_complemento: string | null;
  carnet_expedido: string;
  fecha_nacimiento: string | null;
  Cita: Cita[];
};

export default function FichaPacientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: number; nombre: string }[]>([]);
  const [formNotaAbierto, setFormNotaAbierto] = useState(false);
  const [tituloNota, setTituloNota] = useState('');
  const [notasNota, setNotasNota] = useState('');
  const [fechaNota, setFechaNota] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaNota, setHoraNota] = useState('');
  const [profesionalNota, setProfesionalNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPaciente(await api.getPaciente(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el paciente');
    }
  }, [params.id]);

  const cargarNotas = useCallback(async () => {
    try {
      setNotas(await api.getTratamientosPaciente(params.id));
    } catch {
      // el historial clinico es secundario; si falla no bloquea la ficha
    }
  }, [params.id]);

  useEffect(() => {
    cargar();
    cargarNotas();
    api.getProfesionalesPublico().then(setProfesionales).catch(() => setProfesionales([]));
  }, [cargar, cargarNotas]);

  async function crearNota(e: FormEvent) {
    e.preventDefault();
    setGuardandoNota(true);
    setErrorNota(null);
    try {
      await api.crearTratamiento(params.id, {
        titulo: tituloNota,
        notas: notasNota,
        fecha: fechaNota,
        hora: horaNota || null,
        profesionalId: profesionalNota || null,
      });
      setTituloNota('');
      setNotasNota('');
      setFechaNota(new Date().toISOString().slice(0, 10));
      setHoraNota('');
      setProfesionalNota('');
      setFormNotaAbierto(false);
      cargarNotas();
    } catch (err) {
      setErrorNota(err instanceof Error ? err.message : 'No se pudo guardar la nota');
    } finally {
      setGuardandoNota(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente) return;
    setGuardando(true);
    setOk(false);
    setError(null);
    try {
      await api.actualizarPaciente(paciente.id, {
        nombre_completo: paciente.nombre_completo,
        carnet_identidad: paciente.carnet_identidad,
        carnet_complemento: paciente.carnet_complemento,
        carnet_expedido: paciente.carnet_expedido,
        fecha_nacimiento: paciente.fecha_nacimiento,
      });
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!paciente) return;
    if (paciente.Cita.length > 0) return;
    if (!window.confirm(`¿Eliminar a ${paciente.nombre_completo}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    setError(null);
    try {
      await api.eliminarPaciente(paciente.id);
      router.push('/pacientes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
      setEliminando(false);
    }
  }

  if (error && !paciente) return <p className="text-sm text-danger">{error}</p>;
  if (!paciente) return <p className="text-sm text-foreground/70">Cargando…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{paciente.nombre_completo}</h1>
          <p className="text-sm text-foreground/70">{paciente.codigo_paciente}</p>
        </div>
        {usuario?.permisos?.includes('pacientes') && (
          <button
            onClick={eliminar}
            disabled={eliminando || paciente.Cita.length > 0}
            title={paciente.Cita.length > 0 ? 'No se puede eliminar: tiene citas registradas' : undefined}
            className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {eliminando ? 'Eliminando…' : 'Eliminar paciente'}
          </button>
        )}
      </div>

      <form onSubmit={guardar} className="mb-8 grid max-w-lg gap-3 rounded border border-border bg-panel p-4 text-sm">
        <label>
          Nombre completo
          <input
            value={paciente.nombre_completo}
            onChange={(e) => setPaciente({ ...paciente, nombre_completo: e.target.value })}
            className="mt-1 w-full rounded border border-border px-3 py-1.5"
          />
        </label>
        <label>
          Teléfono (no editable)
          <input value={paciente.telefono} disabled className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 opacity-60" />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label>
            Carnet
            <input
              value={paciente.carnet_identidad}
              onChange={(e) => setPaciente({ ...paciente, carnet_identidad: e.target.value })}
              className="mt-1 w-full rounded border border-border px-3 py-1.5"
            />
          </label>
          <label>
            Complemento
            <input
              value={paciente.carnet_complemento ?? ''}
              onChange={(e) => setPaciente({ ...paciente, carnet_complemento: e.target.value })}
              className="mt-1 w-full rounded border border-border px-3 py-1.5"
            />
          </label>
          <label>
            Expedido
            <input
              value={paciente.carnet_expedido}
              onChange={(e) => setPaciente({ ...paciente, carnet_expedido: e.target.value })}
              className="mt-1 w-full rounded border border-border px-3 py-1.5"
            />
          </label>
        </div>
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={paciente.fecha_nacimiento ?? ''}
            onChange={(e) => setPaciente({ ...paciente, fecha_nacimiento: e.target.value })}
            className="mt-1 w-full rounded border border-border px-3 py-1.5"
          />
        </label>

        {error && <p className="text-danger">{error}</p>}
        {ok && <p className="text-green-700">Guardado.</p>}

        <button
          type="submit"
          disabled={guardando}
          className="mt-1 w-fit rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <h2 className="mb-2 text-sm font-semibold">Historial de citas</h2>
      <div className="mb-8 flex flex-col gap-2">
        {paciente.Cita.map((cita) => (
          <div key={cita.id} className="rounded border border-border bg-panel p-3 text-sm">
            {cita.fecha} {cita.hora_inicio.slice(0, 5)} · {cita.Servicio.nombre} con {cita.Profesional.nombre} · {cita.estado}
          </div>
        ))}
        {paciente.Cita.length === 0 && <p className="text-sm text-foreground/70">Sin citas registradas.</p>}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Historial clínico</h2>
        <button
          onClick={() => setFormNotaAbierto((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
        >
          {formNotaAbierto ? 'Cancelar' : '+ Nueva nota'}
        </button>
      </div>

      {formNotaAbierto && (
        <form onSubmit={crearNota} className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
          <input
            required
            placeholder="Título (ej. Control post-tratamiento)"
            value={tituloNota}
            onChange={(e) => setTituloNota(e.target.value)}
            className="w-full rounded border border-border px-2.5 py-1.5"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="date"
              required
              value={fechaNota}
              onChange={(e) => setFechaNota(e.target.value)}
              className="rounded border border-border px-2.5 py-1.5"
            />
            <input
              type="time"
              value={horaNota}
              onChange={(e) => setHoraNota(e.target.value)}
              placeholder="Hora (opcional)"
              className="rounded border border-border px-2.5 py-1.5"
            />
            <select
              value={profesionalNota}
              onChange={(e) => setProfesionalNota(e.target.value)}
              className="rounded border border-border px-2.5 py-1.5"
            >
              <option value="">Sin profesional</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          {horaNota && !profesionalNota && (
            <p className="text-xs text-muted-foreground">Elige un profesional para validar que la hora no choque con una cita.</p>
          )}
          <textarea
            required
            placeholder="Notas clínicas, observaciones, evolución…"
            value={notasNota}
            onChange={(e) => setNotasNota(e.target.value)}
            rows={3}
            className="w-full rounded border border-border px-2.5 py-1.5"
          />
          {errorNota && <p className="text-danger">{errorNota}</p>}
          <button
            type="submit"
            disabled={guardandoNota}
            className="w-fit rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
          >
            {guardandoNota ? 'Guardando…' : 'Guardar nota'}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {notas.map((n) => (
          <TratamientoItem key={n.id} nota={n} onChange={cargarNotas} />
        ))}
        {notas.length === 0 && <p className="text-sm text-foreground/70">Sin notas clínicas todavía.</p>}
      </div>
    </div>
  );
}
