'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

type Slot = { hora_inicio: string; hora_fin: string };

function formatearHora(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}:00 ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function StepHorario() {
  const { servicioId, profesionalId, fecha, horaInicio, setFecha, setHoraInicio, setStep } = useBooking();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (servicioId && profesionalId && fecha) {
      setLoading(true);
      setError('');
      api
        .getDisponibilidad(profesionalId, servicioId, fecha)
        .then(setSlots)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
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
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <label className="mt-6 block text-xs uppercase tracking-widest text-muted">
        Fecha
        <input
          type="date"
          min={hoy}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="mt-2 block w-full rounded border border-tan/30 px-4 py-2.5 text-sm text-ink normal-case tracking-normal"
        />
      </label>

      <div className="mt-6">
        {!fecha && (
          <p className="text-sm text-muted">Selecciona una fecha para ver los horarios disponibles.</p>
        )}

        {fecha && loading && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-full bg-tan/15" />
            ))}
          </div>
        )}

        {fecha && !loading && !error && slots.length === 0 && (
          <p className="text-sm text-muted">No hay horarios disponibles para esta fecha. Prueba con otro día.</p>
        )}

        {fecha && !loading && slots.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => {
              const elegido = horaInicio === s.hora_inicio;
              return (
                <li key={s.hora_inicio}>
                  <button
                    onClick={() => elegir(s.hora_inicio)}
                    aria-pressed={elegido}
                    className={`w-full rounded-full border px-3 py-2.5 text-sm transition-colors ${
                      elegido
                        ? 'border-espresso bg-espresso text-cream'
                        : 'border-tan/30 text-ink hover:border-espresso'
                    }`}
                  >
                    {formatearHora(s.hora_inicio)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button onClick={() => setStep('profesional')} className="mt-8 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
