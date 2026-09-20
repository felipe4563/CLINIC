'use client';

import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const esInicio = pathname === '/inicio';

  if (!usuario) {
    return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className={esInicio ? 'flex-1' : 'flex-1 px-4 py-6 md:px-8'}>{children}</main>
      </div>
    </div>
  );
}
