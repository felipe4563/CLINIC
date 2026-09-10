'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/authContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const COLLAPSE_KEY = 'novaged_staff_sidebar_collapsed';

export default function AppShell({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  function setCollapsedPersist(value: boolean) {
    setCollapsed(value);
    try {
      localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  function toggleCollapsed() {
    setCollapsedPersist(!collapsed);
  }

  function closeSidebar() {
    setSidebarOpen(false);
    setCollapsedPersist(true);
  }

  if (!usuario) {
    return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} collapsed={collapsed} onNavigate={() => setSidebarOpen(false)} onClose={closeSidebar} />

      {sidebarOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} onToggleCollapsed={toggleCollapsed} collapsed={collapsed} />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
