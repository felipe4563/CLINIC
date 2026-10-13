'use client';
import { useState } from 'react';
import Chevron from '@/components/Chevron';
import type { Pregunta } from '@/lib/tratamientos/tipos';

export default function PreguntasFrecuentes({ preguntas }: { preguntas: Pregunta[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <div className="mt-6 divide-y divide-manhattan/40 border-y border-manhattan/40">
      {preguntas.map((p, i) => {
        const estaAbierta = abierta === i;
        return (
          <div key={p.pregunta}>
            <button
              type="button"
              onClick={() => setAbierta(estaAbierta ? null : i)}
              aria-expanded={estaAbierta}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-lg text-espresso"
            >
              {p.pregunta}
              <Chevron abierto={estaAbierta} />
            </button>
            {estaAbierta && <p className="pb-6 leading-relaxed text-ink">{p.respuesta}</p>}
          </div>
        );
      })}
    </div>
  );
}
