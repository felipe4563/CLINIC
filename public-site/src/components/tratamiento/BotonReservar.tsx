'use client';
import { useBooking } from '@/lib/bookingContext';

export default function BotonReservar({ nombreServicio, className = '' }: { nombreServicio: string; className?: string }) {
  const { open } = useBooking();
  return (
    <button
      type="button"
      onClick={() => open(nombreServicio)}
      className={`min-h-12 rounded-full bg-espresso px-7 text-[15px] text-cream transition-colors hover:bg-espresso-900 ${className}`}
    >
      Reservar este tratamiento
    </button>
  );
}
