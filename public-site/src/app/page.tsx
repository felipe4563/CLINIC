'use client';
import { BookingProvider, useBooking } from '@/lib/bookingContext';
import BookingModal from '@/components/booking/BookingModal';
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

function HomeContent() {
  const { open } = useBooking();

  return (
    <main>
      <Nav onReservar={open} />
      <Hero onReservar={open} />
      <EsenciaMarca />
      <Tratamientos />
      <Silencio />
      <ArtePerfeccion onReservar={open} />
      <Nosotros />
      <Ubicacion />
      <CtaFinal onReservar={open} />
      <Footer />
      <FloatingCta onClick={open} />
      <BookingModal />
    </main>
  );
}

export default function Home() {
  return (
    <BookingProvider>
      <HomeContent />
    </BookingProvider>
  );
}
