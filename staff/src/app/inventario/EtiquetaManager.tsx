'use client';

import { useState } from 'react';

export type Etiqueta = { id: number; nombre: string };

export default function EtiquetaManager({
  titulo,
  etiquetas,
  onCrear,
  onEliminar,
}: {
  titulo: string;
  etiquetas: Etiqueta[];
  onCrear: (nombre: string) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await onCrear(nombre);
      setNombre('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    setError('');
    try {
      await onEliminar(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-3 text-sm">
      <button onClick={() => setAbierto((v) => !v)} className="flex w-full items-center justify-between text-left font-medium">
        {titulo}
        <span className="text-xs text-muted-foreground">{abierto ? 'Ocultar' : `Gestionar (${etiquetas.length})`}</span>
      </button>

      {abierto && (
        <div className="mt-3">
          <form onSubmit={crear} className="flex gap-2">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Nueva ${titulo.toLowerCase()}…`}
              required
              className="min-w-0 flex-1 rounded border border-border px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={guardando}
              className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
            >
              Agregar
            </button>
          </form>
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {etiquetas.map((e) => (
              <span key={e.id} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs">
                {e.nombre}
                <button onClick={() => eliminar(e.id)} className="text-muted-foreground hover:text-danger" aria-label={`Eliminar ${e.nombre}`}>
                  ×
                </button>
              </span>
            ))}
            {etiquetas.length === 0 && <p className="text-xs text-muted-foreground">Ninguna todavía.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
