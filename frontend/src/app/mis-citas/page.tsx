'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function MisCitas() {
  const [citas, setCitas] = useState<any[]>([]);
  const [qrPorCita, setQrPorCita] = useState<Record<number, string>>({});

  useEffect(() => {
    api.misCitas().then(setCitas).catch(console.error);
  }, []);

  async function pagar(citaId: number) {
    const { qrImageBase64 } = await api.generarQR(citaId);
    setQrPorCita((prev) => ({ ...prev, [citaId]: qrImageBase64 }));
  }

  return (
    <main>
      <h1>Mis citas</h1>
      <ul>
        {citas.map((c) => (
          <li key={c.id}>
            {c.fecha} {c.hora_inicio} — {c.estado}
            {c.estado === 'pendiente_pago' && (
              <button onClick={() => pagar(c.id)}>Pagar con QR</button>
            )}
            {qrPorCita[c.id] && <img src={`data:image/png;base64,${qrPorCita[c.id]}`} alt="QR de pago" />}
          </li>
        ))}
      </ul>
    </main>
  );
}
