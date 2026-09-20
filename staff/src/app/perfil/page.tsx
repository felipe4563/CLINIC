'use client';

import { useAuth } from '@/lib/authContext';

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function PerfilPage() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold">Mi perfil</h1>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-panel p-8 text-center shadow-sm">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground">
          {iniciales(usuario.nombre)}
        </span>
        <div>
          <p className="text-lg font-semibold">{usuario.nombre}</p>
          <p className="text-sm text-muted-foreground">{usuario.rol}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-panel p-5 text-sm">
        <div className="flex items-center justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Nombre</span>
          <span className="font-medium">{usuario.nombre}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{usuario.email}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground">Rol</span>
          <span className="font-medium">{usuario.rol}</span>
        </div>
      </div>
    </div>
  );
}
