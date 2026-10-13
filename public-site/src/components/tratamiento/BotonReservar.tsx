'use client';
import { useBooking } from '@/lib/bookingContext';

export default function BotonReservar({ nombreServicio, className = '' }: { nombreServicio: string; className?: string }) {
  const { open } = useBooking();
  return (
    <button
      type="button"
      onClick={() => open(nombreServicio)}
      className={`rounded-full bg-espresso px-7 py-3 text-xs uppercase tracking-[0.2em] text-cream transition-colors hover:bg-tan ${className}`}
    >
      Reservar este tratamiento
    </button>
  );
}
