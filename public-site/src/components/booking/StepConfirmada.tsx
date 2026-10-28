'use client';
import { useBooking } from '@/lib/bookingContext';
import { fechaLarga } from './fechas';

export default function StepConfirmada() {
  const { servicio, profesional, fecha, horaInicio, pago, close } = useBooking();
  const pagado = pago?.estado === 'pagado';
  const saldo = pago ? Math.round((Number(pago.monto_total) - Number(pago.monto)) * 100) / 100 : 0;
  const mensajePago = !pagado
    ? 'Pagas el total en la clínica el día de tu cita.'
    : saldo > 0
      ? `Recibimos tu comprobante. El saldo de Bs ${saldo} se paga en la clínica el día de tu cita.`
      : 'Recibimos tu comprobante. La clínica lo revisa y te confirma por WhatsApp.';

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-espresso text-cream">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h2 className="mt-6 font-serif text-[clamp(34px,4vw,48px)] font-light leading-tight text-espresso">¡Tu cita está reservada!</h2>
      <div className="mt-6 w-full rounded-3xl bg-white p-6 text-left">
        <p className="font-serif text-2xl text-espresso">{servicio?.nombre}</p>
        <p className="mt-1 text-[15px] text-tan">
          {fecha ? fechaLarga(fecha) : ''} · {horaInicio}
          {profesional ? ` · ${profesional.nombre}` : ''}
        </p>
        <p className="mt-4 border-t border-manhattan/40 pt-4 text-[15px] text-ink">{mensajePago}</p>
      </div>
      <button onClick={close} className="mt-8 min-h-12 rounded-full bg-espresso px-10 text-[15px] text-cream hover:bg-espresso-900">
        Listo
      </button>
    </div>
  );
}
