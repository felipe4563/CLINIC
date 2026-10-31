'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { mensajeError } from '@/lib/types';
import PoliticaInasistencia from './PoliticaInasistencia';
import { fechaLarga } from './fechas';

export default function StepConfirmar() {
  const { profesionalId, servicioId, servicio, profesional, paciente, fecha, horaInicio, setCitaId, setPago, setStep, config, setConfig, porcentaje, aceptaPolitica, setAceptaPolitica } = useBooking();
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
      <h2 className="font-serif text-[clamp(30px,3.4vw,42px)] font-light leading-tight text-espresso">Revisa y confirma</h2>
      <p className="mt-1 text-[15px] text-tan">Si algo no está bien, vuelve atrás y cámbialo.</p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="rounded-3xl bg-white p-5 sm:p-7">
          <dl className="grid gap-6 sm:grid-cols-2">
            <Dato titulo="Paciente" icono={<path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0" />}>{paciente?.nombre}</Dato>
            <Dato titulo="Servicio" icono={<path d="M12 3l2.2 5.4L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.6z" />}>{servicio?.nombre}</Dato>
            <Dato titulo="Profesional" icono={<path d="M6 3v5a4 4 0 008 0V3M10 12v3a5 5 0 0010 0v-2M20 11a2 2 0 100 0" />}>{profesional?.nombre}</Dato>
            <Dato titulo="Fecha y hora" icono={<path d="M4 7h16M8 3v4M16 3v4M5 5h14v15H5z" />}>
              {fecha ? fechaLarga(fecha) : ''} · {horaInicio}
            </Dato>
          </dl>
          {cobraAdelanto && (
            <div className="mt-6 border-t border-manhattan/40 pt-2">
              <PoliticaInasistencia texto={config?.politica_inasistencia ?? ''} aceptada={aceptaPolitica} onChange={setAceptaPolitica} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 rounded-3xl bg-espresso p-6 text-neutral-cream sm:flex-row sm:items-center sm:px-8">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-arena">Total</p>
            <p className="font-serif text-5xl font-light text-cream">{precio !== null ? `Bs ${precio.toLocaleString('es-BO')}` : '—'}</p>
            <p className="mt-1 text-[15px]">
              {cobraAdelanto ? 'Pagas el total con QR para asegurar tu horario.' : 'Pagas el total en la clínica el día de tu cita.'}
            </p>
            {error && <p role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          </div>
          <div className="sm:w-72">
          <button
            onClick={confirmar}
            disabled={cargando || !config || (cobraAdelanto && !aceptaPolitica)}
            className="min-h-12 w-full rounded-full bg-cream px-6 text-[15px] text-espresso transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cargando
              ? 'Confirmando…'
              : metodo === 'qr_fijo' && montoAPagar !== null
                ? `Continuar al pago de Bs ${montoAPagar}`
                : cobraAdelanto && montoAPagar !== null
                  ? `Confirmar y pagar Bs ${montoAPagar}`
                  : 'Confirmar reserva'}
          </button>
          {cobraAdelanto && !aceptaPolitica && <p className="mt-2 text-center text-xs text-arena">Acepta la política de inasistencia para continuar.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dato({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-cream text-espresso">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icono}
        </svg>
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-tan">{titulo}</dt>
        <dd className="mt-0.5 font-serif text-xl leading-snug text-espresso">{children}</dd>
      </div>
    </div>
  );
}
