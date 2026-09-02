'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepProfesional() {
  const { servicioId, setProfesionalId, setStep } = useBooking();
  const [profesionales, setProfesionales] = useState<any[]>([]);

  useEffect(() => {
    if (servicioId) api.getProfesionales(servicioId).then(setProfesionales).catch(console.error);
  }, [servicioId]);

  function elegir(id: number) {
    setProfesionalId(id);
    setStep('horario');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige un profesional</h3>
      <ul className="mt-6 space-y-3">
        {profesionales.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => elegir(p.id)}
              className="w-full rounded border border-tan/30 px-4 py-3 text-left hover:border-tan"
            >
              {p.nombre}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setStep('servicio')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
