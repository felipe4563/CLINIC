'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export type Usuario = { id: number; nombre: string; email: string; activo: boolean; Rol: { nombre: string } };

export default function UsuarioItem({
  usuario,
  esUnoMismo,
  roles,
  onChange,
}: {
  usuario: Usuario;
  esUnoMismo: boolean;
  roles: { nombre: string }[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(usuario.nombre);
  const [email, setEmail] = useState(usuario.email);
  const [rolNombre, setRolNombre] = useState(usuario.Rol.nombre);
  const [password, setPassword] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  function empezarEdicion() {
    setNombre(usuario.nombre);
    setEmail(usuario.email);
    setRolNombre(usuario.Rol.nombre);
    setPassword('');
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarUsuario(usuario.id, {
        nombre,
        email,
        rolNombre,
        ...(password ? { password } : {}),
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
    setError('');
    try {
      await api.actualizarUsuario(usuario.id, { activo: !usuario.activo });
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    }
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    setError('');
    try {
      await api.eliminarUsuario(usuario.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
      setEliminando(false);
    }
  }

  if (editando) {
    return (
      <tr className="border-b border-border/50 bg-accent-soft/30 last:border-0">
        <td colSpan={5} className="p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded border border-border px-2 py-1.5 text-sm" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
            <select
              value={rolNombre}
              onChange={(e) => setRolNombre(e.target.value)}
              disabled={esUnoMismo}
              className="rounded border border-border px-2 py-1.5 text-sm disabled:opacity-50"
            >
              {roles.map((r) => (
                <option key={r.nombre} value={r.nombre}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (opcional)"
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
          </div>
          {esUnoMismo && <p className="mt-2 text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>}
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
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/50 text-sm last:border-0 hover:bg-accent-soft/30">
      <td className="px-3 py-2.5">
        <span className="font-medium">{usuario.nombre}</span>
        {esUnoMismo && <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>}
      </td>
      <td className="px-3 py-2.5 text-foreground/70">{usuario.email}</td>
      <td className="px-3 py-2.5">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground/70">{usuario.Rol.nombre}</span>
      </td>
      <td className="px-3 py-2.5">
        {usuario.activo ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Activo</span>
        ) : (
          <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted-foreground">Inactivo</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button
            onClick={toggleActivo}
            disabled={esUnoMismo && usuario.activo}
            className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {usuario.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={eliminar}
            disabled={eliminando || esUnoMismo}
            title={esUnoMismo ? 'No puedes eliminar tu propia cuenta' : undefined}
            className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
        {error && <p className="mt-1 text-right text-xs text-danger">{error}</p>}
      </td>
    </tr>
  );
}
