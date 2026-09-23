'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function avatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  return avatarUrl.startsWith('/uploads/') ? `${API_URL}${avatarUrl}` : avatarUrl;
}

export default function PerfilPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState('');
  const inputAvatarRef = useRef<HTMLInputElement>(null);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);

  if (!usuario) return null;

  async function seleccionarAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoAvatar(true);
    setErrorAvatar('');
    try {
      const res = await api.subirAvatar(archivo);
      actualizarUsuario({ avatar_url: res.avatar_url });
    } catch (err) {
      setErrorAvatar(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendoAvatar(false);
      if (inputAvatarRef.current) inputAvatarRef.current.value = '';
    }
  }

  async function quitarAvatar() {
    setSubiendoAvatar(true);
    setErrorAvatar('');
    try {
      await api.eliminarAvatar();
      actualizarUsuario({ avatar_url: null });
    } catch (err) {
      setErrorAvatar(err instanceof Error ? err.message : 'No se pudo quitar la foto');
    } finally {
      setSubiendoAvatar(false);
    }
  }

  async function guardarPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorPassword('');
    setPasswordOk(false);
    if (passwordNueva.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword('Las contraseñas nuevas no coinciden');
      return;
    }
    setGuardandoPassword(true);
    try {
      await api.cambiarPassword(passwordActual, passwordNueva);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      setPasswordOk(true);
    } catch (err) {
      setErrorPassword(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setGuardandoPassword(false);
    }
  }

  const src = avatarSrc(usuario.avatar_url);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Mi perfil</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-panel p-8 text-center shadow-sm">
            <div className="relative">
              {src ? (
                <img src={src} alt={usuario.nombre} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-semibold text-accent-foreground">
                  {iniciales(usuario.nombre)}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-muted-foreground">{usuario.rol}</p>
            </div>
            <input ref={inputAvatarRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={seleccionarAvatar} className="hidden" />
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => inputAvatarRef.current?.click()}
                disabled={subiendoAvatar}
                className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent-soft disabled:opacity-50"
              >
                {subiendoAvatar ? 'Subiendo…' : src ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {src && (
                <button
                  type="button"
                  onClick={quitarAvatar}
                  disabled={subiendoAvatar}
                  className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent-soft disabled:opacity-50"
                >
                  Quitar
                </button>
              )}
            </div>
            {errorAvatar && <p className="text-xs text-danger">{errorAvatar}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-panel p-5 text-sm">
            <p className="mb-3 font-medium">Datos de la cuenta</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-3">
              <div className="flex items-center justify-between border-b border-border py-2 sm:flex-col sm:items-start sm:justify-center sm:border-none sm:py-0">
                <span className="text-muted-foreground">Nombre</span>
                <span className="font-medium sm:mt-1">{usuario.nombre}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2 sm:flex-col sm:items-start sm:justify-center sm:border-none sm:py-0">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium sm:mt-1">{usuario.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 sm:flex-col sm:items-start sm:justify-center sm:border-none sm:py-0">
                <span className="text-muted-foreground">Rol</span>
                <span className="font-medium sm:mt-1">{usuario.rol}</span>
              </div>
            </div>
          </div>

          <form onSubmit={guardarPassword} className="rounded-2xl border border-border bg-panel p-5 text-sm">
            <p className="mb-3 font-medium">Cambiar contraseña</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="password"
                placeholder="Contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded border border-border px-2.5 py-1.5"
              />
              <input
                type="password"
                placeholder="Nueva contraseña (mín. 8)"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded border border-border px-2.5 py-1.5"
              />
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                required
                autoComplete="new-password"
                className="rounded border border-border px-2.5 py-1.5"
              />
            </div>
            {errorPassword && <p className="mt-2 text-xs text-danger">{errorPassword}</p>}
            {passwordOk && <p className="mt-2 text-xs text-stat-green">Contraseña actualizada correctamente.</p>}
            <button
              type="submit"
              disabled={guardandoPassword}
              className="mt-3 rounded bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-60"
            >
              {guardandoPassword ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
