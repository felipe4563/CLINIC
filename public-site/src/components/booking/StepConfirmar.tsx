'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { mensajeError } from '@/lib/types';
import PoliticaInasistencia from './PoliticaInasistencia';

export default function StepConfirmar() {
  const { profesionalId, servicioId, servicio, profesional, fecha, horaInicio, setCitaId, setPago, setStep, config, setConfig, porcentaje, setPorcentaje, aceptaPolitica, setAceptaPolitica } = useBooking();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .getConfiguracionPublica()
      .then(setConfig)
      .catch(() => setConfig({ metodo_pago_online: 'qr_banco' }));
  }, [setConfig]);

  const metodo = config?.metodo_pago_online ?? 'qr_banco';
  const cobraAdelanto = metodo !== 'ninguno';

  const precio = servicio?.precio ? Number(servicio.precio) : null;
  const montoAPagar = precio !== null ? Math.round(precio * (porcentaje / 100) * 100) / 100 : null;

  async function confirmar() {
    setError('');
    if (metodo === 'qr_fijo') {
      setStep('pago');
      return;
    }
    setCargando(true);
    try {
      const { cita, pago, requierePago } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio, porcentaje, aceptaPolitica);
      setCitaId(cita.id);
      setPago(pago);
      setStep(requierePago ? 'pago' : 'confirmada');
    } catch (e: unknown) {
      setError(mensajeError(e));
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

      {cobraAdelanto && precio !== null && (
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
      {cobraAdelanto && (
        <PoliticaInasistencia
          texto={config?.politica_inasistencia ?? ''}
          aceptada={aceptaPolitica}
          onChange={setAceptaPolitica}
        />
      )}
      {!cobraAdelanto && precio !== null && (
        <p className="mt-6 text-sm text-muted">Pagas el total (Bs. {precio}) en la clínica el día de tu cita.</p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={confirmar}
        disabled={cargando || !config || (cobraAdelanto && !aceptaPolitica)}
        className="mt-8 w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-50"
      >
        {cargando
          ? 'Confirmando…'
          : metodo === 'qr_fijo' && montoAPagar !== null
            ? `Continuar al pago de Bs. ${montoAPagar}`
            : cobraAdelanto && montoAPagar !== null
              ? `Confirmar y pagar Bs. ${montoAPagar}`
              : 'Confirmar reserva'}
      </button>
      {cobraAdelanto && !aceptaPolitica && (
        <p className="mt-2 text-center text-xs text-muted">Marca la casilla de la política para continuar.</p>
      )}
    </div>
  );
}
