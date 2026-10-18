'use client';
import { BookingProvider, useBooking } from '@/lib/bookingContext';
import BookingModal from '@/components/booking/BookingModal';
import Nav from '@/components/Nav';
import FloatingCta from '@/components/FloatingCta';
import WhatsappFlotante from '@/components/WhatsappFlotante';
import Footer from '@/components/Footer';
import Contacto from '@/components/Contacto';
import Hero from '@/components/inicio/Hero';
import Credenciales from '@/components/inicio/Credenciales';
import Manifiesto from '@/components/inicio/Manifiesto';
import Cinta from '@/components/inicio/Cinta';
import CartaTratamientos from '@/components/inicio/CartaTratamientos';
import MasBuscados from '@/components/inicio/MasBuscados';
import PrimeraVisita from '@/components/inicio/PrimeraVisita';
import Doctora from '@/components/inicio/Doctora';
import PreguntasInicio from '@/components/inicio/PreguntasInicio';

function HomeContent() {
  const { open } = useBooking();
  const reservar = () => open();

  return (
    <main className="overflow-x-clip">
      <Nav onReservar={reservar} />
      <Hero onReservar={open} />
      <Credenciales />
      <Manifiesto />
      <Cinta />
      <CartaTratamientos />
      <MasBuscados />
      <PrimeraVisita />
      <Doctora onReservar={reservar} />
      <PreguntasInicio />
      <Contacto onReservar={reservar} />
      <Footer />
      <FloatingCta onClick={reservar} />
      <WhatsappFlotante />
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
