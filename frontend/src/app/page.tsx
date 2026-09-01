'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function Home() {
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(console.error);
  }, []);

  return (
    <main>
      <h1>Servicios</h1>
      <ul>
        {servicios.map((s) => (
          <li key={s.id}>
            {s.nombre} — Bs. {s.precio}
            <Link href={`/reservar?servicioId=${s.id}`}> Reservar</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
