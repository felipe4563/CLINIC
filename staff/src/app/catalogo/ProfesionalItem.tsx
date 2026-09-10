'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Servicio } from './ServicioItem';

export type Profesional = {
  id: number;
  nombre: string;
  especialidad: string | null;
  foto_url: string | null;
  activo: boolean;
  Servicios?: Servicio[];
};

type Horario = { id: number; dia_semana: number; hora_inicio: string; hora_fin: string };

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ProfesionalItem({
  profesional,
  todosLosServicios,
  onChange,
}: {
  profesional: Profesional;
  todosLosServicios: Servicio[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [nombre, setNombre] = useState(profesional.nombre);
  const [especialidad, setEspecialidad] = useState(profesional.especialidad || '');
  const [fotoUrl, setFotoUrl] = useState(profesional.foto_url || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [diaNuevo, setDiaNuevo] = useState('1');
  const [horaInicioNueva, setHoraInicioNueva] = useState('09:00');
  const [horaFinNueva, setHoraFinNueva] = useState('17:00');

  const serviciosAsignadosIds = new Set((profesional.Servicios || []).map((s) => s.id));

  useEffect(() => {
    if (expandido) {
      api.getHorarios(profesional.id).then(setHorarios).catch(() => setHorarios([]));
    }
  }, [expandido, profesional.id]);

  function empezarEdicion() {
    setNombre(profesional.nombre);
    setEspecialidad(profesional.especialidad || '');
    setFotoUrl(profesional.foto_url || '');
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarProfesional(profesional.id, {
        nombre,
        especialidad: especialidad || null,
        foto_url: fotoUrl || null,
      });
      setEditando(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo() {
    await api.actualizarProfesional(profesional.id, { activo: !profesional.activo });
    onChange();
  }

  async function toggleServicio(servicioId: number, asignado: boolean) {
    if (asignado) {
      await api.desvincularServicio(profesional.id, servicioId);
    } else {
      await api.vincularServicio(profesional.id, servicioId);
    }
    onChange();
  }

  async function agregarHorario(e: React.FormEvent) {
    e.preventDefault();
    const nuevo = await api.crearHorario(profesional.id, {
      dia_semana: Number(diaNuevo),
      hora_inicio: horaInicioNueva,
      hora_fin: horaFinNueva,
    });
    setHorarios((h) => [...h, nuevo].sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)));
  }

  async function eliminarHorario(id: number) {
    await api.eliminarHorario(id);
    setHorarios((h) => h.filter((x) => x.id !== id));
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-3 text-sm">
        <div className="flex flex-col gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded border border-border px-2 py-1.5" />
          <input
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Especialidad"
            className="rounded border border-border px-2 py-1.5"
          />
          <input
            value={fotoUrl}
            onChange={(e) => setFotoUrl(e.target.value)}
            placeholder="URL de foto (opcional)"
            className="rounded border border-border px-2 py-1.5"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={() => setEditando(false)} className="rounded border border-border px-3 py-1.5 text-xs">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iniciales = profesional.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-lg border border-border bg-panel text-sm">
      <div className="flex flex-col gap-3 p-3">
        <button onClick={() => setExpandido((v) => !v)} className="flex min-w-0 items-center gap-3 text-left">
          {profesional.foto_url ? (
            <img src={profesional.foto_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              {iniciales || '?'}
            </span>
          )}
          <span className="min-w-0">
            <p className="break-words font-medium">
              {profesional.nombre} {profesional.especialidad ? `· ${profesional.especialidad}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {(profesional.Servicios || []).length} servicio(s) asignado(s)
              {!profesional.activo ? ' · Inactivo' : ''}
            </p>
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button onClick={toggleActivo} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            {profesional.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button onClick={() => setExpandido((v) => !v)} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            {expandido ? 'Ocultar' : 'Detalles'}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Servicios que atiende</p>
            <div className="flex flex-wrap gap-2">
              {todosLosServicios.map((s) => {
                const asignado = serviciosAsignadosIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleServicio(s.id, asignado)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      asignado ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted-foreground hover:border-accent'
                    }`}
                  >
                    {s.nombre}
                  </button>
                );
              })}
              {todosLosServicios.length === 0 && <p className="text-xs text-muted-foreground">No hay servicios en el catálogo.</p>}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Horario disponible</p>
            <div className="flex flex-col gap-1.5">
              {horarios.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded border border-border px-2.5 py-1.5 text-xs">
                  <span>
                    {DIAS[h.dia_semana]} · {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
                  </span>
                  <button onClick={() => eliminarHorario(h.id)} className="text-danger hover:underline">
                    Quitar
                  </button>
                </div>
              ))}
              {horarios.length === 0 && <p className="text-xs text-muted-foreground">Sin horarios configurados.</p>}
            </div>

            <form onSubmit={agregarHorario} className="mt-2 flex flex-wrap items-center gap-2">
              <select value={diaNuevo} onChange={(e) => setDiaNuevo(e.target.value)} className="rounded border border-border px-2 py-1.5 text-xs">
                {DIAS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={horaInicioNueva}
                onChange={(e) => setHoraInicioNueva(e.target.value)}
                className="rounded border border-border px-2 py-1.5 text-xs"
              />
              <span className="text-xs text-muted-foreground">a</span>
              <input
                type="time"
                value={horaFinNueva}
                onChange={(e) => setHoraFinNueva(e.target.value)}
                className="rounded border border-border px-2 py-1.5 text-xs"
              />
              <button type="submit" className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                Agregar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
