'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepHorario() {
  const { servicioId, profesionalId, fecha, setFecha, setHoraInicio, setStep } = useBooking();
  const [slots, setSlots] = useState<any[]>([]);
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (servicioId && profesionalId && fecha) {
      api.getDisponibilidad(profesionalId, servicioId, fecha).then(setSlots).catch(console.error);
    } else {
      setSlots([]);
    }
  }, [servicioId, profesionalId, fecha]);

  function elegir(hora: string) {
    setHoraInicio(hora);
    setStep('login');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige fecha y horario</h3>
      <input
        type="date"
        min={hoy}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="mt-6 rounded border border-tan/30 px-4 py-2"
      />
      <ul className="mt-6 grid grid-cols-3 gap-2">
        {slots.map((s) => (
          <li key={s.hora_inicio}>
            <button
              onClick={() => elegir(s.hora_inicio)}
              className="w-full rounded border border-tan/30 px-3 py-2 text-sm hover:border-tan"
            >
              {s.hora_inicio}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setStep('profesional')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
