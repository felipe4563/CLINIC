'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepPago() {
  const { citaId, pago, close } = useBooking();
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmada, setConfirmada] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!citaId) return;
    api
      .generarQR(citaId)
      .then((res) => setQr(res.qrImageBase64))
      .catch((e) => setError(e.message));
  }, [citaId]);

  useEffect(() => {
    if (!citaId || confirmada) return;

    async function verificar() {
      try {
        const res = await api.estadoPago(citaId);
        if (res.pagado) {
          setConfirmada(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // silencioso: el polling reintenta solo, no interrumpimos al usuario
      }
    }

    pollRef.current = setInterval(verificar, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [citaId, confirmada]);

  async function verificarAhora() {
    if (!citaId) return;
    setVerificando(true);
    setError('');
    try {
      const res = await api.estadoPago(citaId);
      if (res.pagado) {
        setConfirmada(true);
        if (pollRef.current) clearInterval(pollRef.current);
      } else {
        setError('Todavía no detectamos tu pago. Si ya pagaste, espera unos segundos e intenta de nuevo.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerificando(false);
    }
  }

  const esSena = pago && Number(pago.porcentaje) === 50;
  const saldo = pago ? Math.round((Number(pago.monto_total) - Number(pago.monto)) * 100) / 100 : null;

  if (confirmada) {
    return (
      <div className="text-center">
        <h3 className="font-serif text-2xl text-espresso">¡Cita confirmada!</h3>
        <p className="mt-4 text-sm text-ink">Recibirás la confirmación también por WhatsApp.</p>
        {esSena && saldo !== null && (
          <p className="mt-2 text-sm text-muted">El saldo de Bs. {saldo} se paga en la clínica el día de tu cita.</p>
        )}
        <button onClick={close} className="mt-8 rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">
        {pago ? `Paga Bs. ${pago.monto} con QR` : 'Paga con QR'}
      </h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {qr && (
        <img src={`data:image/png;base64,${qr}`} alt="QR de pago" className="mx-auto mt-6 w-64" />
      )}
      <p className="mt-6 text-sm text-muted">
        Escanea el código con tu app bancaria. Estamos revisando automáticamente si ya llegó tu pago.
      </p>
      {esSena && saldo !== null && (
        <p className="mt-2 text-sm text-muted">
          Esto es tu seña del 50%. El saldo de Bs. {saldo} se paga en la clínica el día de tu cita.
        </p>
      )}
      <button
        onClick={verificarAhora}
        disabled={verificando}
        className="mt-6 rounded-full border border-espresso/40 text-espresso text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-60"
      >
        {verificando ? 'Verificando…' : 'Ya pagué, verificar ahora'}
      </button>
      <div>
        <button onClick={close} className="mt-4 text-xs uppercase tracking-widest text-tan">
          Cerrar
        </button>
      </div>
    </div>
  );
}
