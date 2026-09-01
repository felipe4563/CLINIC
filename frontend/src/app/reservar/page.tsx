'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function ReservarInner() {
  const params = useSearchParams();
  const router = useRouter();
  const servicioId = params.get('servicioId');

  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (servicioId) api.getProfesionales(servicioId).then(setProfesionales);
  }, [servicioId]);

  useEffect(() => {
    if (profesionalId && servicioId && fecha) {
      api.getDisponibilidad(profesionalId, servicioId, fecha).then(setSlots).catch(console.error);
    }
  }, [profesionalId, servicioId, fecha]);

  async function reservar(horaInicio: string) {
    if (!api.isLoggedIn()) {
      router.push(`/login?next=/reservar?servicioId=${servicioId}`);
      return;
    }
    try {
      const { cita } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio);
      router.push(`/mis-citas?citaId=${cita.id}`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main>
      <h1>Reservar cita</h1>
      <select onChange={(e) => setProfesionalId(e.target.value)} defaultValue="">
        <option value="" disabled>Elige un profesional</option>
        {profesionales.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {slots.map((s) => (
          <li key={s.hora_inicio}>
            {s.hora_inicio} - {s.hora_fin}
            <button onClick={() => reservar(s.hora_inicio)}>Reservar</button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function Reservar() {
  return (
    <Suspense fallback={null}>
      <ReservarInner />
    </Suspense>
  );
}
