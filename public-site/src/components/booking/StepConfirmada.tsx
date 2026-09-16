'use client';
import { useBooking } from '@/lib/bookingContext';

export default function StepConfirmada() {
  const { servicio, fecha, horaInicio, close } = useBooking();

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">¡Reserva confirmada!</h3>
      <p className="mt-4 text-sm text-ink">
        {servicio?.nombre} — {fecha} {horaInicio}
      </p>
      <p className="mt-2 text-sm text-muted">Pagas el total en la clínica el día de tu cita.</p>
      <button onClick={close} className="mt-8 rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
        Cerrar
      </button>
    </div>
  );
}
