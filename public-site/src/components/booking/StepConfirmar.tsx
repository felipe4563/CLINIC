'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepConfirmar() {
  const { profesionalId, servicioId, fecha, horaInicio, setCitaId, setStep } = useBooking();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setError('');
    setCargando(true);
    try {
      const { cita } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio);
      setCitaId(cita.id);
      setStep('pago');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Confirmar reserva</h3>
      <div className="mt-6 space-y-2 text-sm text-ink">
        <p>Fecha: {fecha}</p>
        <p>Hora: {horaInicio}</p>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={confirmar}
        disabled={cargando}
        className="mt-8 w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-50"
      >
        {cargando ? 'Confirmando…' : 'Confirmar reserva'}
      </button>
    </div>
  );
}
