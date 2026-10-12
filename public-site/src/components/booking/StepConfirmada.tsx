'use client';
import { useBooking } from '@/lib/bookingContext';

export default function StepConfirmada() {
  const { servicio, fecha, horaInicio, pago, close } = useBooking();
  const pagado = pago?.estado === 'pagado';
  const saldo = pago ? Math.round((Number(pago.monto_total) - Number(pago.monto)) * 100) / 100 : 0;
  const mensajePago = !pagado
    ? 'Pagas el total en la clínica el día de tu cita.'
    : saldo > 0
      ? `Recibimos tu comprobante. El saldo de Bs. ${saldo} se paga en la clínica el día de tu cita.`
      : 'Recibimos tu comprobante. Te enviamos la confirmación por WhatsApp.';

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">¡Reserva confirmada!</h3>
      <p className="mt-4 text-sm text-ink">
        {servicio?.nombre} — {fecha} {horaInicio}
      </p>
      <p className="mt-2 text-sm text-muted">{mensajePago}</p>
      <button onClick={close} className="mt-8 rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
        Cerrar
      </button>
    </div>
  );
}
