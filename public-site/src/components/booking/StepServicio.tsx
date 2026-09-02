'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepServicio() {
  const { setServicioId, setServicio, setStep } = useBooking();
  const [servicios, setServicios] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getServicios()
      .then(setServicios)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function elegir(s: any) {
    setServicioId(s.id);
    setServicio(s);
    setStep('profesional');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige un servicio</h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <ul className="mt-6 space-y-3">
        {servicios.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => elegir(s)}
              className="w-full rounded border border-tan/30 px-4 py-3 text-left hover:border-tan"
            >
              <span className="font-medium text-ink">{s.nombre}</span>
              <span className="ml-2 text-sm text-muted">Bs. {s.precio}</span>
            </button>
          </li>
        ))}
      </ul>
      {!loading && !error && servicios.length === 0 && (
        <p className="mt-6 text-sm text-muted">No hay servicios disponibles por el momento.</p>
      )}
    </div>
  );
}
