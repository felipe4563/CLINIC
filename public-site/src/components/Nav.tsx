'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MagneticButton from './MagneticButton';

const ENLACES = [
  { href: '/#especialidades', texto: 'Especialidades' },
  { href: '/#destacados', texto: 'Tratamientos' },
  { href: '/#doctora', texto: 'La doctora' },
  { href: '/#preguntas', texto: 'Preguntas' },
  { href: '/#contacto', texto: 'Contacto' },
];

// Menú fijo: transparente sobre la portada y una cápsula de vidrio al bajar.
// `solido` lo deja siempre como cápsula (páginas de tratamiento).
export default function Nav({ onReservar, solido = false }: { onReservar: () => void; solido?: boolean }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [bajo, setBajo] = useState(false);

  useEffect(() => {
    function alBajar() {
      setBajo(window.scrollY > 40);
    }
    alBajar();
    window.addEventListener('scroll', alBajar, { passive: true });
    return () => window.removeEventListener('scroll', alBajar);
  }, []);

  useEffect(() => {
    if (!menuAbierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAbierto(false);
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [menuAbierto]);

  const capsula = solido || bajo || menuAbierto;

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2 transition-all duration-500 md:pl-7 ${
          capsula ? 'vidrio shadow-[0_20px_50px_-30px_rgba(45,36,30,0.45)]' : 'border border-transparent'
        }`}
      >
        <Link href="/#inicio" className="flex shrink-0 items-center gap-2.5 text-espresso" aria-label="Clinic NovagED, inicio">
          <Image src="/novaged-assets/icon-Bvf3Rv87.png" alt="" width={24} height={34} className="h-9 w-auto" priority />
          <span className="font-serif text-[26px] leading-none md:text-[28px]">
            Clinic <em className="italic">NovagED</em>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="rounded-full px-4 py-2 text-[15px] text-ink transition-colors hover:bg-white/60 hover:text-espresso">
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <MagneticButton>
            <button
              type="button"
              onClick={onReservar}
              className="hidden min-h-12 items-center gap-2 rounded-full bg-espresso px-6 text-[15px] text-cream transition-colors hover:bg-espresso-900 sm:inline-flex"
            >
              Reservar cita
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </MagneticButton>
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex h-12 w-12 items-center justify-center rounded-full text-espresso transition-colors hover:bg-white/60 lg:hidden"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              {menuAbierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuAbierto && (
        <div id="menu-movil" className="vidrio mx-auto mt-2 max-w-7xl rounded-[32px] p-6 shadow-[0_30px_60px_-30px_rgba(45,36,30,0.5)] lg:hidden">
          <nav aria-label="Menú" className="flex flex-col">
            {ENLACES.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setMenuAbierto(false)}
                className="border-b border-manhattan/40 py-4 font-serif text-3xl font-light text-espresso"
              >
                {e.texto}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMenuAbierto(false);
              onReservar();
            }}
            className="mt-6 min-h-12 w-full rounded-full bg-espresso px-6 text-[15px] text-cream transition-colors hover:bg-espresso-900"
          >
            Reservar cita
          </button>
        </div>
      )}
    </header>
  );
}
