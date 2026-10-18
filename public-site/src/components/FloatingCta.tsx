'use client';
import { useEffect, useState } from 'react';
import MagneticButton from './MagneticButton';

// Botón flotante de reserva. Aparece cuando la reserva de la portada ya no se ve.
export default function FloatingCta({ onClick }: { onClick: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function alBajar() {
      setVisible(window.scrollY > 700);
    }
    alBajar();
    window.addEventListener('scroll', alBajar, { passive: true });
    return () => window.removeEventListener('scroll', alBajar);
  }, []);

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 transition-all duration-500 md:bottom-6 md:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <MagneticButton>
        <button
          type="button"
          onClick={onClick}
          tabIndex={visible ? 0 : -1}
          className="inline-flex min-h-14 items-center gap-2.5 rounded-full bg-espresso px-6 text-[15px] text-cream shadow-[0_24px_44px_-18px_rgba(45,36,30,0.7)] transition-colors hover:bg-espresso-900"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          Reservar cita
        </button>
      </MagneticButton>
    </div>
  );
}
