'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';
import { GRUPOS_NAV } from './navItems';

type Usuario = { id: number; nombre: string; email: string; rol: string; permisos: string[] };

type AuthContextValue = {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
    const enLogin = pathname === '/login';
    if (!usuario && !enLogin) {
      router.replace('/login');
      return;
    }
    if (usuario && (enLogin || pathname === '/')) {
      router.replace('/inicio');
      return;
    }
    if (usuario && pathname !== '/inicio') {
      const item = GRUPOS_NAV.flatMap((g) => g.items).find(
        (i) => i.href !== '/inicio' && pathname.startsWith(i.href),
      );
      if (item && !usuario.permisos?.includes(item.permiso)) {
        router.replace('/inicio');
      }
    }
  }, [loading, usuario, pathname, router]);

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

  return <AuthContext.Provider value={{ usuario, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
