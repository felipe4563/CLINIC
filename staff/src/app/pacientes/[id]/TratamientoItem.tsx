'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export type NotaClinica = {
  id: number;
  fecha: string;
  hora: string | null;
  titulo: string;
  notas: string;
  Profesional: { id: number; nombre: string } | null;
};

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export default function TratamientoItem({ nota, onChange }: { nota: NotaClinica; onChange: () => void }) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(nota.titulo);
  const [notas, setNotas] = useState(nota.notas);
  const [fecha, setFecha] = useState(nota.fecha);
  const [hora, setHora] = useState(nota.hora ? nota.hora.slice(0, 5) : '');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  function empezarEdicion() {
    setTitulo(nota.titulo);
    setNotas(nota.notas);
    setFecha(nota.fecha);
    setHora(nota.hora ? nota.hora.slice(0, 5) : '');
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarTratamiento(nota.id, { titulo, notas, fecha, hora: hora || null });
      setEditando(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm('¿Eliminar esta nota clínica?')) return;
    setEliminando(true);
    try {
      await api.eliminarTratamiento(nota.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
      setEliminando(false);
    }
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-3 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="min-w-0 flex-1 rounded border border-border px-2 py-1.5" />
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded border border-border px-2 py-1.5" />
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded border border-border px-2 py-1.5" />
        </div>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded border border-border px-2 py-1.5"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-2 flex gap-2">
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
    );
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{nota.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {fmtFecha(nota.fecha)}
            {nota.hora ? ` ${nota.hora.slice(0, 5)}` : ''}
            {nota.Profesional ? ` · ${nota.Profesional.nombre}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button
            onClick={eliminar}
            disabled={eliminando}
            className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:opacity-40"
          >
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-foreground/80">{nota.notas}</p>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
