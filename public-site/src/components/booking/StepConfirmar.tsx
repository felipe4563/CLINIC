'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepConfirmar() {
  const { profesionalId, servicioId, servicio, profesional, fecha, horaInicio, setCitaId, setPago, setStep } = useBooking();
  const [porcentaje, setPorcentaje] = useState<50 | 100>(100);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const precio = servicio?.precio ? Number(servicio.precio) : null;
  const montoAPagar = precio !== null ? Math.round(precio * (porcentaje / 100) * 100) / 100 : null;

  async function confirmar() {
    setError('');
    setCargando(true);
    try {
      const { cita, pago } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio, porcentaje);
      setCitaId(cita.id);
      setPago(pago);
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
        <p>Servicio: {servicio?.nombre}{precio !== null ? ` — Bs. ${precio}` : ''}</p>
        <p>Profesional: {profesional?.nombre}</p>
        <p>Fecha: {fecha}</p>
        <p>Hora: {horaInicio}</p>
      </div>

      {precio !== null && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted">¿Cuánto pagas ahora?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPorcentaje(50)}
              aria-pressed={porcentaje === 50}
              className={`rounded border px-4 py-3 text-left ${porcentaje === 50 ? 'border-espresso bg-espresso text-cream' : 'border-tan/30 text-ink hover:border-espresso'}`}
            >
              <span className="block text-sm font-medium">Seña del 50%</span>
              <span className="block text-xs opacity-80">Bs. {Math.round(precio * 0.5 * 100) / 100}</span>
            </button>
            <button
              type="button"
              onClick={() => setPorcentaje(100)}
              aria-pressed={porcentaje === 100}
              className={`rounded border px-4 py-3 text-left ${porcentaje === 100 ? 'border-espresso bg-espresso text-cream' : 'border-tan/30 text-ink hover:border-espresso'}`}
            >
              <span className="block text-sm font-medium">Pago completo</span>
              <span className="block text-xs opacity-80">Bs. {precio}</span>
            </button>
          </div>
          {porcentaje === 50 && (
            <p className="mt-2 text-xs text-muted">
              El saldo restante (Bs. {Math.round(precio * 0.5 * 100) / 100}) se paga en la clínica el día de tu cita.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={confirmar}
        disabled={cargando}
        className="mt-8 w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-50"
      >
        {cargando ? 'Confirmando…' : montoAPagar !== null ? `Confirmar y pagar Bs. ${montoAPagar}` : 'Confirmar reserva'}
      </button>
    </div>
  );
}
