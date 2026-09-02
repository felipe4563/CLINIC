'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepProfesional() {
  const { servicioId, setProfesionalId, setProfesional, setStep } = useBooking();
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (servicioId) {
      setLoading(true);
      api
        .getProfesionales(servicioId)
        .then(setProfesionales)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [servicioId]);

  function elegir(p: any) {
    setProfesionalId(p.id);
    setProfesional(p);
    setStep('horario');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige un profesional</h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <ul className="mt-6 space-y-3">
        {profesionales.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => elegir(p)}
              className="w-full rounded border border-tan/30 px-4 py-3 text-left hover:border-tan"
            >
              {p.nombre}
            </button>
          </li>
        ))}
      </ul>
      {!loading && !error && profesionales.length === 0 && (
        <p className="mt-6 text-sm text-muted">No hay profesionales disponibles para este servicio.</p>
      )}
      <button onClick={() => setStep('servicio')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
