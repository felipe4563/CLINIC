'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export type PermisoInfo = { clave: string; etiqueta: string; descripcion: string };
export type Rol = { id: number; nombre: string; permisos: string[]; usuarios: number };

export default function RolItem({
  rol,
  permisosDisponibles,
  onChange,
}: {
  rol: Rol;
  permisosDisponibles: PermisoInfo[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(rol.nombre);
  const [permisos, setPermisos] = useState<string[]>(rol.permisos);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  function empezarEdicion() {
    setNombre(rol.nombre);
    setPermisos(rol.permisos);
    setError('');
    setEditando(true);
  }

  function togglePermiso(clave: string) {
    setPermisos((p) => (p.includes(clave) ? p.filter((x) => x !== clave) : [...p, clave]));
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarRol(rol.id, { nombre, permisos });
      setEditando(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return;
    setEliminando(true);
    setError('');
    try {
      await api.eliminarRol(rol.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
      setEliminando(false);
    }
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-4 text-sm">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del rol"
          className="w-full rounded border border-border px-2.5 py-1.5"
        />
        <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Módulos permitidos</p>
        <div className="flex flex-col gap-2">
          {permisosDisponibles.map((p) => (
            <label key={p.clave} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={permisos.includes(p.clave)}
                onChange={() => togglePermiso(p.clave)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">{p.etiqueta}</span>
                <span className="block text-xs text-muted-foreground">{p.descripcion}</span>
              </span>
            </label>
          ))}
        </div>

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-3 flex gap-2">
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
    <div className="rounded-lg border border-border bg-panel p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{rol.nombre}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {rol.usuarios} usuario{rol.usuarios === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button
            onClick={eliminar}
            disabled={eliminando || rol.usuarios > 0}
            title={rol.usuarios > 0 ? 'No se puede eliminar: hay usuarios con este rol' : undefined}
            className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {rol.permisos.length === 0 && <span className="text-xs text-muted-foreground">Sin permisos asignados</span>}
        {rol.permisos.map((clave) => {
          const info = permisosDisponibles.find((p) => p.clave === clave);
          return (
            <span key={clave} className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground/70">
              {info?.etiqueta || clave}
            </span>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
