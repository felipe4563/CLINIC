'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepPago() {
  const { citaId, close } = useBooking();
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!citaId) return;
    api
      .generarQR(citaId)
      .then((res) => setQr(res.qrImageBase64))
      .catch((e) => setError(e.message));
  }, [citaId]);

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">Paga con QR</h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {qr && (
        <img src={`data:image/png;base64,${qr}`} alt="QR de pago" className="mx-auto mt-6 w-64" />
      )}
      <p className="mt-6 text-sm text-muted">
        Escanea el código con tu app bancaria. Tu cita se confirmará
        automáticamente al detectar el pago.
      </p>
      <button onClick={close} className="mt-8 text-xs uppercase tracking-widest text-tan">
        Cerrar
      </button>
    </div>
  );
}
