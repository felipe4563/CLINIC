'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepServicio() {
  const { setServicioId, setStep } = useBooking();
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(console.error);
  }, []);

  function elegir(id: number) {
    setServicioId(id);
    setStep('profesional');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige un servicio</h3>
      <ul className="mt-6 space-y-3">
        {servicios.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => elegir(s.id)}
              className="w-full rounded border border-tan/30 px-4 py-3 text-left hover:border-tan"
            >
              <span className="font-medium text-ink">{s.nombre}</span>
              <span className="ml-2 text-sm text-muted">Bs. {s.precio}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
