'use client';
import { useState } from 'react';

// NOTE: `onReservar` is a stub trigger for opening the booking modal.
// Task 8/9 will wire this to the real modal via BookingContext.

export default function Nav({ onReservar }: { onReservar: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-5">
        <a href="#top" className="font-serif text-xl text-espresso">
          Clinic <em className="italic">NovagED</em>
        </a>
        <nav className="hidden md:flex items-center gap-10 text-xs tracking-widest uppercase text-ink">
          <a href="#tratamientos">Tratamientos</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#ubicacion">Ubicación</a>
        </nav>
        <button
          onClick={onReservar}
          className="rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-tan transition-colors"
        >
          Reservar Consulta
        </button>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-ink"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden absolute left-0 right-0 w-full bg-cream border-t border-tan/30 px-6 py-4 flex flex-col items-start gap-4 text-xs tracking-widest uppercase text-ink">
          <a href="#tratamientos" onClick={() => setMenuOpen(false)}>
            Tratamientos
          </a>
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>
            Nosotros
          </a>
          <a href="#ubicacion" onClick={() => setMenuOpen(false)}>
            Ubicación
          </a>
          <button
            onClick={() => {
              setMenuOpen(false);
              onReservar();
            }}
            className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-tan transition-colors"
          >
            Reservar Consulta
          </button>
        </div>
      )}
    </header>
  );
}
