'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MisCitas() {
  const router = useRouter();
  const [citas, setCitas] = useState<any[]>([]);
  const [qrPorCita, setQrPorCita] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.misCitas().then(setCitas).catch(() => {
      router.push('/login?next=/mis-citas');
    });
  }, [router]);

  async function pagar(citaId: number) {
    try {
      const { qrImageBase64 } = await api.generarQR(citaId);
      setQrPorCita((prev) => ({ ...prev, [citaId]: qrImageBase64 }));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main>
      <h1>Mis citas</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
