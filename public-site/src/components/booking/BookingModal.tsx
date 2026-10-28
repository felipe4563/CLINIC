'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import { useBooking, type Step } from '@/lib/bookingContext';
import StepServicio from './StepServicio';
import StepPaciente from './StepPaciente';
import StepHorario from './StepHorario';
import StepConfirmar from './StepConfirmar';
import StepPago from './StepPago';
import StepPagoComprobante from './StepPagoComprobante';
import StepConfirmada from './StepConfirmada';
import { fechaLarga } from './fechas';

const PASOS: { clave: Step; titulo: string }[] = [
  { clave: 'servicio', titulo: 'Servicio' },
  { clave: 'paciente', titulo: 'Paciente' },
  { clave: 'horario', titulo: 'Horario' },
  { clave: 'confirmar', titulo: 'Confirmación' },
  { clave: 'pago', titulo: 'Pago' },
];

export default function BookingModal() {
  const b = useBooking();
  const { isOpen, close, step, setStep, config } = b;

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const actual = step === 'confirmada' ? PASOS.length : PASOS.findIndex((p) => p.clave === step);
  // Con la cita ya creada (QR del banco) no se vuelve atrás: el horario quedó tomado.
  const bloqueado = step === 'confirmada' || (step === 'pago' && b.citaId !== null);

  const siguiente: { a: Step; listo: boolean } | null =
    step === 'servicio' ? { a: 'paciente', listo: b.servicioId !== null }
    : step === 'paciente' ? { a: 'horario', listo: b.paciente !== null }
    : step === 'horario' ? { a: 'confirmar', listo: b.horaInicio !== null }
    : null;
  const atras: Step | null = bloqueado ? null : actual > 0 ? PASOS[actual - 1].clave : null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-espresso-900/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reservar cita"
        className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-cream shadow-[0_60px_120px_-40px_rgba(26,17,9,0.7)] sm:h-[min(880px,94vh)] sm:rounded-[32px] lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lateral con los pasos (pantallas grandes) */}
        <aside className="hidden w-[300px] shrink-0 flex-col bg-neutral-cream p-8 lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream">
              <Image src="/novaged-assets/isotipo-chocolate.png" alt="" width={36} height={36} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-tan">Reserva en línea</p>
              <p className="font-serif text-2xl leading-tight text-espresso">
                Clinic <em className="italic">NovagED</em>
              </p>
            </div>
          </div>

          <ol className="mt-10 flex flex-col gap-2">
            {PASOS.map((p, i) => {
              const hecho = i < actual;
              const esActual = i === actual;
              const puedeIr = hecho && !bloqueado && i < actual;
              return (
                <li key={p.clave}>
                  <button
                    type="button"
                    disabled={!puedeIr}
                    onClick={() => setStep(p.clave)}
                    aria-current={esActual ? 'step' : undefined}
                    className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                      esActual ? 'bg-espresso text-cream' : hecho ? 'bg-cream text-espresso hover:bg-white' : 'text-tan'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm ${
                        esActual ? 'border-manhattan text-cream' : hecho ? 'border-espresso bg-espresso text-cream' : 'border-tan/40'
                      }`}
                    >
                      {hecho ? <Check /> : i + 1}
                    </span>
                    <span className="text-[17px]">{p.titulo}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <Resumen />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          {/* Cabecera: progreso en celular, cerrar siempre */}
          <div className="flex items-center gap-4 border-b border-manhattan/40 px-5 py-4 sm:px-10 lg:border-0 lg:pb-0 lg:pt-6">
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-[11px] uppercase tracking-[0.2em] text-tan">
                {step === 'confirmada' ? 'Reserva lista' : `Paso ${actual + 1} de ${PASOS.length}`}
              </p>
              <p className="font-serif text-xl text-espresso">{step === 'confirmada' ? '¡Gracias!' : PASOS[actual]?.titulo}</p>
              <div className="mt-2 flex gap-1">
                {PASOS.map((p, i) => (
                  <span key={p.clave} className={`h-1 flex-1 rounded-full ${i <= actual ? 'bg-espresso' : 'bg-manhattan/40'}`} />
                ))}
              </div>
            </div>
            <button onClick={close} className="ml-auto -mr-2 rounded-full p-2 text-tan hover:bg-neutral-cream hover:text-espresso" aria-label="Cerrar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="barra-fina min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5 sm:px-10 lg:pt-2">
            {step === 'servicio' && <StepServicio />}
            {step === 'paciente' && <StepPaciente />}
            {step === 'horario' && <StepHorario />}
            {step === 'confirmar' && <StepConfirmar />}
            {step === 'pago' && (config?.metodo_pago_online === 'qr_fijo' ? <StepPagoComprobante /> : <StepPago />)}
            {step === 'confirmada' && <StepConfirmada />}
          </div>

          {(atras || siguiente) && (
            <div className="flex items-center gap-3 border-t border-manhattan/40 bg-cream px-5 py-4 sm:px-10">
              {atras && (
                <button
                  type="button"
                  onClick={() => setStep(atras)}
                  className="min-h-12 rounded-full border border-manhattan px-6 text-[15px] text-espresso transition-colors hover:bg-neutral-cream"
                >
                  Atrás
                </button>
              )}
              {siguiente && (
                <button
                  type="button"
                  disabled={!siguiente.listo}
                  onClick={() => setStep(siguiente.a)}
                  className="ml-auto min-h-12 rounded-full bg-espresso px-8 text-[15px] text-cream transition-colors hover:bg-espresso-900 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Siguiente
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Resumen() {
  const { servicio, paciente, profesional, fecha, horaInicio } = useBooking();
  const filas = [
    servicio && { t: 'Servicio', v: servicio.nombre },
    paciente && { t: 'Paciente', v: paciente.nombre },
    profesional && { t: 'Profesional', v: profesional.nombre },
    fecha && horaInicio && { t: 'Fecha', v: `${fechaLarga(fecha)} · ${horaInicio}` },
  ].filter(Boolean) as { t: string; v: string }[];
  if (!filas.length) return null;
  return (
    <dl className="mt-auto space-y-3 rounded-2xl bg-cream p-5 text-sm">
      {filas.map((f) => (
        <div key={f.t}>
          <dt className="text-[11px] uppercase tracking-[0.18em] text-tan">{f.t}</dt>
          <dd className="mt-0.5 text-espresso first-letter:uppercase">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
