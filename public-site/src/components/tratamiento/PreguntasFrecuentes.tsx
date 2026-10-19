'use client';
import { useId, useState } from 'react';
import Chevron from '@/components/Chevron';
import type { Pregunta } from '@/lib/tratamientos/tipos';

export default function PreguntasFrecuentes({ preguntas }: { preguntas: Pregunta[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const base = useId();
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
              aria-controls={`${base}-r${i}`}
              className="flex min-h-12 w-full items-center justify-between gap-4 py-5 text-left font-serif text-xl font-light text-espresso md:text-2xl"
            >
              {p.pregunta}
              <Chevron abierto={estaAbierta} />
            </button>
            <p id={`${base}-r${i}`} hidden={!estaAbierta} className="pb-6 leading-relaxed text-ink">{p.respuesta}</p>
          </div>
        );
      })}
    </div>
  );
}
