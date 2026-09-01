'use client';
import { useState } from 'react';

const categorias = [
  {
    titulo: 'Tratamientos Faciales',
    descripcion:
      'Tratamientos orientados a mejorar la calidad, hidratación, luminosidad y regeneración de la piel mediante medicina estética avanzada.',
    columnaIzquierda: { titulo: 'Áreas de enfoque', items: ['Calidad de piel', 'Hidratación profunda', 'Despigmentación', 'Regeneración celular'] },
    columnaDerecha: { titulo: 'Tratamientos', items: ['Microneedling', 'PRP facial', 'PDRN / PN', 'Exosomas', 'Peelings médicos', 'Ácido hialurónico', 'Coctel de vitaminas', 'DMAE + silicio orgánico', 'Cóctel de aminoácidos'] },
  },
  {
    titulo: 'Armonización Facial',
    descripcion:
      'Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Procedimientos', items: ['Ácido hialurónico (Fillers)', 'Toxina botulínica (Botox)', 'Perfilado de nariz', 'Relleno / perfilado de labios', 'Mentoplastia', 'Marcación mandibular', 'Levantamiento de pómulos'] },
  },
  {
    // PLACEHOLDER: contenido pendiente de confirmar con el usuario
    titulo: 'Rejuvenecimiento · Lifting',
    descripcion: 'Tratamientos enfocados en restaurar firmeza y frescura, redefiniendo el contorno facial de forma natural.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Procedimientos', items: ['Hilos tensores', 'Bioestimuladores de colágeno', 'Lifting no quirúrgico'] },
  },
  {
    // PLACEHOLDER: contenido pendiente de confirmar con el usuario
    titulo: 'Tratamientos Corporales',
    descripcion: 'Procedimientos orientados al cuidado, firmeza y bienestar integral del cuerpo.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Tratamientos', items: ['Reducción de medidas', 'Reafirmación corporal', 'Hidratación corporal profunda'] },
  },
  {
    // PLACEHOLDER: contenido pendiente de confirmar con el usuario
    titulo: 'Plasma Láser',
    descripcion: 'Tecnología de plasma para renovación y tensado de la piel con mínima invasión.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Aplicaciones', items: ['Plasma facial', 'Tensado de párpados', 'Renovación de textura'] },
  },
];

export default function Tratamientos() {
  const [abierto, setAbierto] = useState<number | null>(0);

  return (
    <section id="tratamientos" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <div>
          {/* PLACEHOLDER: replace with real photo of the treatment room */}
          <div className="aspect-[4/5] w-full rounded-sm bg-espresso/10" />
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted">01</p>
          <h2 className="mt-2 font-serif text-4xl text-espresso">Medicina Estética</h2>
          <p className="mt-4 max-w-md text-muted">
            Tratamientos médico-estéticos avanzados orientados a la mejora
            visible, el rejuvenecimiento y el bienestar integral de la piel y el
            cuerpo.
          </p>

          <p className="mt-10 text-xs tracking-widest uppercase text-tan">Tratamientos Detalles</p>

          <div className="mt-4 divide-y divide-tan/20 border-t border-tan/20">
            {categorias.map((cat, i) => (
              <div key={cat.titulo}>
                <button
                  onClick={() => setAbierto(abierto === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left font-serif text-xl text-espresso"
                >
                  {cat.titulo}
                  <span className="text-tan">{abierto === i ? '−' : '+'}</span>
                </button>
                {abierto === i && (
                  <div className="pb-6">
                    <p className="text-sm text-muted">{cat.descripcion}</p>
                    <div className="mt-4 grid gap-6 sm:grid-cols-2">
                      {cat.columnaIzquierda && (
                        <div>
                          <p className="text-xs tracking-widest uppercase text-muted">{cat.columnaIzquierda.titulo}</p>
                          <ul className="mt-2 space-y-1 text-sm text-ink">
                            {cat.columnaIzquierda.items.map((it) => <li key={it}>• {it}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <p className="text-xs tracking-widest uppercase text-muted">{cat.columnaDerecha.titulo}</p>
                        <ul className="mt-2 space-y-1 text-sm text-ink">
                          {cat.columnaDerecha.items.map((it) => <li key={it}>+ {it}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
