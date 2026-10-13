'use client';
import type { ReactNode } from 'react';
import { BookingProvider, useBooking } from '@/lib/bookingContext';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import FloatingCta from '@/components/FloatingCta';
import BookingModal from '@/components/booking/BookingModal';

function Contenido({ children }: { children: ReactNode }) {
  const { open } = useBooking();
  return (
    <main>
      <Nav onReservar={open} solido />
      {children}
      <Footer />
      <FloatingCta onClick={open} />
      <BookingModal />
    </main>
  );
}

export default function MarcoTratamiento({ children }: { children: ReactNode }) {
  return (
    <BookingProvider>
      <Contenido>{children}</Contenido>
    </BookingProvider>
  );
}
