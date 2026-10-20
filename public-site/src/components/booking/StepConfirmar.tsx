'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { mensajeError } from '@/lib/types';
import PoliticaInasistencia from './PoliticaInasistencia';

export default function StepConfirmar() {
  const { profesionalId, servicioId, servicio, profesional, fecha, horaInicio, setCitaId, setPago, setStep, config, setConfig, porcentaje, aceptaPolitica, setAceptaPolitica } = useBooking();
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
        <p className="mt-6 text-sm text-muted">Pagas el total (Bs. {precio}) con QR para asegurar tu horario.</p>
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
