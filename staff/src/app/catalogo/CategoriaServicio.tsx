'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

// Especialidad y grupo de un servicio. Las cinco de la carta de la web son fijas
// (solo Medicina Estética tiene grupos); las demás se agregan aquí y llevan `id`.

export type Especialidad = { id?: number; nombre: string; grupos: string[] };

export const SIN_ESPECIALIDAD = 'Sin especialidad';

const NUEVA = '__nueva__';

export function etiquetaCategoria(especialidad: string | null | undefined, grupo: string | null | undefined) {
  if (!especialidad) return null;
  return grupo ? `${especialidad} · ${grupo}` : especialidad;
}

export default function CategoriaServicio({
  especialidades,
  especialidad,
  grupo,
  onCambio,
  onEspecialidades,
  className = '',
}: {
  especialidades: Especialidad[];
  especialidad: string;
  grupo: string;
  onCambio: (especialidad: string, grupo: string) => void;
  // Avisa la lista nueva al agregar o quitar una especialidad.
  onEspecialidades?: (lista: Especialidad[]) => void;
  className?: string;
}) {
  const [creando, setCreando] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const elegida = especialidades.find((e) => e.nombre === especialidad);
  const grupos = elegida?.grupos ?? [];
  const campo = 'mt-1 block w-full rounded border border-border bg-panel px-2 py-1.5 text-sm text-foreground';

  async function guardarNueva() {
    setOcupado(true);
    setError('');
    try {
      const nueva: Especialidad = await api.crearEspecialidad(nombreNueva);
      onEspecialidades?.([...especialidades, nueva]);
      onCambio(nueva.nombre, '');
      setCreando(false);
      setNombreNueva('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar');
    } finally {
      setOcupado(false);
    }
  }

  async function quitar() {
    if (!elegida?.id || !confirm(`¿Quitar la especialidad "${elegida.nombre}"?`)) return;
    setError('');
    try {
      await api.borrarEspecialidad(elegida.id);
      onEspecialidades?.(especialidades.filter((e) => e.id !== elegida.id));
      onCambio('', '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar');
    }
  }

  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
      <div className="text-xs text-muted-foreground">
        {creando ? (
          <>
            Nueva especialidad
            <div className="mt-1 flex gap-2">
              <input
                autoFocus
                value={nombreNueva}
                onChange={(e) => setNombreNueva(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (nombreNueva.trim()) guardarNueva();
                  }
                  if (e.key === 'Escape') setCreando(false);
                }}
                maxLength={80}
                placeholder="Ej. Nutrición"
                className="block w-full rounded border border-border bg-panel px-2 py-1.5 text-sm text-foreground"
              />
              <button
                type="button"
                onClick={guardarNueva}
                disabled={ocupado || !nombreNueva.trim()}
                className="shrink-0 rounded bg-accent px-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                {ocupado ? 'Agregando…' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreando(false);
                  setError('');
                }}
                className="shrink-0 rounded border border-border px-3 text-sm text-foreground hover:bg-accent-soft"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <label>
            Especialidad *
            <select
              required
              value={especialidad}
              onChange={(e) => {
                if (e.target.value === NUEVA) {
                  setCreando(true);
                  setError('');
                } else onCambio(e.target.value, '');
              }}
              className={campo}
            >
              <option value="" disabled>
                Elegir…
              </option>
              {especialidades.map((e) => (
                <option key={e.nombre} value={e.nombre}>
                  {e.nombre}
                </option>
              ))}
              {onEspecialidades && <option value={NUEVA}>+ Nueva especialidad…</option>}
            </select>
          </label>
        )}
        {!creando && elegida?.id && onEspecialidades && (
          <button type="button" onClick={quitar} className="mt-1 text-xs text-muted-foreground underline hover:text-danger">
            Quitar esta especialidad
          </button>
        )}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      {grupos.length > 0 && (
        <label className="text-xs text-muted-foreground">
          Grupo
          <select value={grupo} onChange={(e) => onCambio(especialidad, e.target.value)} className={campo}>
            <option value="">Sin grupo</option>
            {grupos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
