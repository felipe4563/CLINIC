'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';
import { GRUPOS_NAV } from './navItems';

type Usuario = { id: number; nombre: string; email: string; rol: string; permisos: string[]; avatar_url?: string | null };

type AuthContextValue = {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  actualizarUsuario: (parcial: Partial<Usuario>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function rutaAutorizada(pathname: string, usuario: Usuario | null): boolean {
  const enLogin = pathname === '/login';
  if (!usuario) return enLogin;
  if (enLogin || pathname === '/') return false;
  if (pathname === '/inicio') return true;
  const item = GRUPOS_NAV.flatMap((g) => g.items).find(
    (i) => i.href !== '/inicio' && pathname.startsWith(i.href),
  );
  if (item && !usuario.permisos?.includes(item.permiso)) return false;
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const actual = api.getUsuarioActual();
    setUsuario(actual);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!rutaAutorizada(pathname, usuario)) {
      router.replace(usuario ? '/inicio' : '/login');
    }
  }, [loading, usuario, pathname, router]);

  // No renderizamos la página hasta confirmar que esta ruta esta autorizada:
  // si montáramos el contenido mientras el redirect anterior aún está en
  // vuelo, la página dispararía sus propios fetch (p.ej. /staff/usuarios)
  // antes de ser desmontada, generando 403 innecesarios contra el backend.
  const autorizado = !loading && rutaAutorizada(pathname, usuario);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    api.setSession(res.token, res.usuario);
    setUsuario(res.usuario);
    router.replace('/inicio');
  }

  function logout() {
    api.logout();
    setUsuario(null);
    router.replace('/login');
  }

  function actualizarUsuario(parcial: Partial<Usuario>) {
    setUsuario((actual) => {
      if (!actual) return actual;
      const actualizado = { ...actual, ...parcial };
      api.setSession(api.getTokenActual(), actualizado);
      return actualizado;
    });
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, actualizarUsuario }}>
      {autorizado ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
