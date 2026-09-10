'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import UsuarioItem, { type Usuario } from './UsuarioItem';
import RolItem, { type Rol, type PermisoInfo } from './RolItem';
import { IconUserPlus, IconX } from '@/components/icons';

export default function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState<PermisoInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formUsuarioAbierto, setFormUsuarioAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolNombre, setRolNombre] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  const [formRolAbierto, setFormRolAbierto] = useState(false);
  const [nombreRol, setNombreRol] = useState('');
  const [permisosRol, setPermisosRol] = useState<string[]>([]);
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [errorRol, setErrorRol] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [u, r, p] = await Promise.all([api.getUsuarios(), api.getRoles(), api.getPermisosDisponibles()]);
      setUsuarios(u);
      setRoles(r);
      setPermisosDisponibles(p);
      setRolNombre((actual) => actual || r[0]?.nombre || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceso restringido');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearUsuario(e: FormEvent) {
    e.preventDefault();
    setGuardandoUsuario(true);
    setError(null);
    try {
      await api.crearUsuario({ nombre, email, password, rolNombre });
      setNombre('');
      setEmail('');
      setPassword('');
      setFormUsuarioAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    } finally {
      setGuardandoUsuario(false);
    }
  }

  function togglePermisoNuevoRol(clave: string) {
    setPermisosRol((p) => (p.includes(clave) ? p.filter((x) => x !== clave) : [...p, clave]));
  }

  async function crearRol(e: FormEvent) {
    e.preventDefault();
    setGuardandoRol(true);
    setErrorRol(null);
    try {
      await api.crearRol({ nombre: nombreRol, permisos: permisosRol });
      setNombreRol('');
      setPermisosRol([]);
      setFormRolAbierto(false);
      cargar();
    } catch (err) {
      setErrorRol(err instanceof Error ? err.message : 'No se pudo crear el rol');
    } finally {
      setGuardandoRol(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Usuarios internos</h1>
        <button
          onClick={() => setFormUsuarioAbierto((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft"
        >
          {formUsuarioAbierto ? <IconX className="h-4 w-4" /> : <IconUserPlus className="h-4 w-4" />}
          {formUsuarioAbierto ? 'Cancelar' : 'Nuevo usuario'}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {formUsuarioAbierto && (
        <form
          onSubmit={crearUsuario}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-panel p-4 text-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="block">
            Nombre
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 w-full rounded border border-border px-2.5 py-1.5" />
          </label>
          <label className="block">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Rol
            <select value={rolNombre} onChange={(e) => setRolNombre(e.target.value)} className="mt-1 w-full rounded border border-border px-2.5 py-1.5">
              {roles.map((r) => (
                <option key={r.id} value={r.nombre}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={guardandoUsuario}
              className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
            >
              {guardandoUsuario ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-8 flex flex-col gap-2">
        {usuarios.map((u) => (
          <UsuarioItem key={u.id} usuario={u} esUnoMismo={u.id === yo?.id} roles={roles} onChange={cargar} />
        ))}
        {usuarios.length === 0 && !error && <p className="text-sm text-muted-foreground">No hay usuarios todavía.</p>}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Roles y permisos</h2>
        <button
          onClick={() => setFormRolAbierto((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft"
        >
          {formRolAbierto ? <IconX className="h-4 w-4" /> : <IconUserPlus className="h-4 w-4" />}
          {formRolAbierto ? 'Cancelar' : 'Nuevo rol'}
        </button>
      </div>

      {formRolAbierto && (
        <form onSubmit={crearRol} className="mb-4 rounded-lg border border-border bg-panel p-4 text-sm">
          <input
            required
            value={nombreRol}
            onChange={(e) => setNombreRol(e.target.value)}
            placeholder="Nombre del rol (ej. Marketing)"
            className="w-full max-w-xs rounded border border-border px-2.5 py-1.5"
          />
          <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Módulos permitidos</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {permisosDisponibles.map((p) => (
              <label key={p.clave} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={permisosRol.includes(p.clave)}
                  onChange={() => togglePermisoNuevoRol(p.clave)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{p.etiqueta}</span>
                  <span className="block text-xs text-muted-foreground">{p.descripcion}</span>
                </span>
              </label>
            ))}
          </div>
          {errorRol && <p className="mt-2 text-danger">{errorRol}</p>}
          <button
            type="submit"
            disabled={guardandoRol}
            className="mt-3 rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
          >
            {guardandoRol ? 'Creando…' : 'Crear rol'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <RolItem key={r.id} rol={r} permisosDisponibles={permisosDisponibles} onChange={cargar} />
        ))}
        {roles.length === 0 && <p className="text-sm text-muted-foreground">No hay roles todavía.</p>}
      </div>
    </div>
  );
}
