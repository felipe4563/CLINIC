'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ProfesionalesInner() {
  const params = useSearchParams();
  const servicioId = params.get('servicioId');
  const [profesionales, setProfesionales] = useState<any[]>([]);

  useEffect(() => {
    if (servicioId) api.getProfesionales(servicioId).then(setProfesionales).catch(console.error);
  }, [servicioId]);

  return (
    <main>
      <h1>Profesionales</h1>
      <ul>
        {profesionales.map((p) => (
          <li key={p.id}>
            {p.nombre}
            <Link href={`/reservar?servicioId=${servicioId}&profesionalId=${p.id}`}> Reservar</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function Profesionales() {
  return (
    <Suspense fallback={null}>
      <ProfesionalesInner />
    </Suspense>
  );
}
