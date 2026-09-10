'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Nav({ onReservar }: { onReservar: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 ${
        solid ? 'bg-cream/90 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center">
          <Image
            src={solid ? '/novaged-assets/horizontal_dark-YqD6kOfW.png' : '/novaged-assets/horizontal_light-D14IcGKW.png'}
            alt="Clinic NovagED"
            width={220}
            height={66}
            className="h-12 w-auto md:h-14"
            priority
          />
        </a>
        <nav
          className={`hidden md:flex items-center gap-10 text-[10px] tracking-[0.22em] uppercase transition-colors duration-500 ${
            solid ? 'text-ink' : 'text-cream/90'
          }`}
        >
          <a href="#tratamientos" className="hover:opacity-70">Tratamientos</a>
          <a href="#nosotros" className="hover:opacity-70">Nosotros</a>
          <a href="#ubicacion" className="hover:opacity-70">Ubicación</a>
        </nav>
        <button
          onClick={onReservar}
          className={`hidden md:inline-flex rounded-full text-[10px] tracking-[0.2em] uppercase px-7 py-[11px] transition-colors duration-500 ${
            solid
              ? 'bg-espresso text-cream hover:bg-tan'
              : 'border border-cream/40 text-cream hover:border-cream/80'
          }`}
        >
          Reservar Consulta
        </button>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`md:hidden p-2 transition-colors duration-500 ${solid ? 'text-ink' : 'text-cream'}`}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
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
