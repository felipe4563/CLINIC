'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { mensajeError } from '@/lib/types';

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
      .catch((e: unknown) => setError(mensajeError(e)));
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
    } catch (e: unknown) {
      setError(mensajeError(e));
    } finally {
      setVerificando(false);
    }
  }

  if (confirmada) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center py-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-espresso text-cream">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="mt-6 font-serif text-[clamp(34px,4vw,48px)] font-light leading-tight text-espresso">¡Cita confirmada!</h2>
        <p className="mt-3 text-[15px] text-tan">Recibimos tu pago. Te llega la confirmación por WhatsApp.</p>
        <button onClick={close} className="mt-8 min-h-12 rounded-full bg-espresso px-10 text-[15px] text-cream hover:bg-espresso-900">
          Listo
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-[clamp(30px,3.4vw,42px)] font-light leading-tight text-espresso">
        {pago ? `Paga Bs ${pago.monto} con QR` : 'Paga con QR'}
      </h2>
      <p className="mt-1 text-[15px] text-tan">Escanea el código con la app de tu banco. Revisamos solos cuando llega tu pago.</p>
      {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="mx-auto mt-6 flex max-w-sm flex-col items-center rounded-3xl bg-white p-6 text-center">
        {qr ? (
          <Image src={`data:image/png;base64,${qr}`} alt="QR de pago" width={256} height={256} unoptimized className="w-64 rounded-2xl" />
        ) : (
          <span className="h-64 w-64 animate-pulse rounded-2xl bg-neutral-cream" aria-hidden="true" />
        )}
        <button
          onClick={verificarAhora}
          disabled={verificando}
          className="mt-6 min-h-12 w-full rounded-full border border-espresso px-6 text-[15px] text-espresso hover:bg-neutral-cream disabled:opacity-50"
        >
          {verificando ? 'Verificando…' : 'Ya pagué, verificar ahora'}
        </button>
      </div>
    </div>
  );
}
