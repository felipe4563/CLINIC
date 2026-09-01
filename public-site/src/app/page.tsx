'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';
import FloatingCta from '@/components/FloatingCta';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import EsenciaMarca from '@/components/EsenciaMarca';
import Tratamientos from '@/components/Tratamientos';
import Silencio from '@/components/Silencio';
import ArtePerfeccion from '@/components/ArtePerfeccion';
import Nosotros from '@/components/Nosotros';
import Ubicacion from '@/components/Ubicacion';
import CtaFinal from '@/components/CtaFinal';

export default function Home() {
  // TODO(Task 8/9): replace this with BookingContext's openModal() once the
  // booking modal exists. Every onReservar prop below wires to this same
  // handler, so Task 8/9 only needs to change this one function.
  const [modalOpenPlaceholder, setModalOpenPlaceholder] = useState(false);
  function onReservar() {
    setModalOpenPlaceholder(true);
  }

  return (
    <main>
      <Nav onReservar={onReservar} />
      <Hero onReservar={onReservar} />
      <EsenciaMarca />
      <Tratamientos />
      <Silencio />
      <ArtePerfeccion />
      <Nosotros />
      <Ubicacion />
      <CtaFinal onReservar={onReservar} />
      <Footer />
      <FloatingCta onClick={onReservar} />
      {modalOpenPlaceholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-6">
          <div className="rounded bg-cream p-8 text-center">
            <p className="text-ink">Modal de reserva pendiente (Task 8/9).</p>
            <button onClick={() => setModalOpenPlaceholder(false)} className="mt-4 text-tan underline">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
