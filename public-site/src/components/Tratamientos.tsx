'use client';
import { useState } from 'react';
import Image from 'next/image';

const detallesMedicinaEstetica = [
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
    titulo: 'Rejuvenecimiento · Lifting',
    descripcion: 'Tratamientos enfocados en restaurar firmeza y frescura, redefiniendo el contorno facial de forma natural.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Procedimientos', items: ['Hilos tensores', 'Bioestimuladores de colágeno', 'Lifting no quirúrgico'] },
  },
  {
    titulo: 'Tratamientos Corporales',
    descripcion: 'Procedimientos orientados al cuidado, firmeza y bienestar integral del cuerpo.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Tratamientos', items: ['Reducción de medidas', 'Reafirmación corporal', 'Hidratación corporal profunda'] },
  },
  {
    titulo: 'Plasma Láser',
    descripcion: 'Tecnología de plasma para renovación y tensado de la piel con mínima invasión.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Aplicaciones', items: ['Plasma facial', 'Tensado de párpados', 'Renovación de textura'] },
  },
];

const categorias = [
  {
    numero: '01',
    titulo: 'Medicina Estética',
    descripcion:
      'Tratamientos médico-estéticos avanzados orientados a la mejora visible, el rejuvenecimiento y el bienestar integral de la piel y el cuerpo.',
    imagen: '/novaged-assets/medicinaEstetica-DQhnxto0.png',
    detalles: detallesMedicinaEstetica,
  },
  {
    numero: '02',
    titulo: 'Ginecología y Obstetricia',
    descripcion: 'Atención integral femenina con enfoque preventivo, diagnóstico y seguimiento especializado.',
    imagen: '/novaged-assets/ginecologia-BjPYN0D4.png',
    detalles: null,
  },
  {
    numero: '03',
    titulo: 'Ecografía',
    descripcion: 'Servicios de diagnóstico por imagen orientados a evaluación médica precisa y especializada.',
    imagen: '/novaged-assets/ecografia-De6bdoYN.png',
    detalles: null,
  },
  {
    numero: '04',
    titulo: 'Fisioterapia',
    descripcion: 'Tratamientos terapéuticos orientados a rehabilitación, bienestar físico y recuperación funcional.',
    imagen: '/novaged-assets/fisioterapia-Dya6snx4.png',
    detalles: null,
  },
  {
    numero: '05',
    titulo: 'Enfermería',
    descripcion: 'Servicios básicos de apoyo clínico y control médico.',
    imagen: '/novaged-assets/enfermeria-BQQNcDdH.png',
    detalles: null,
  },
];

export default function Tratamientos({ onReservar }: { onReservar: () => void }) {
  const [abierto, setAbierto] = useState<number | null>(null);

  return (
    <section id="tratamientos" className="bg-cream">
      {categorias.map((cat, i) => (
        <div key={cat.titulo} className="relative md:flex md:min-h-screen">
          <div className={`relative h-[60vh] md:h-screen md:w-1/2 md:sticky md:top-0 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
            <Image src={cat.imagen} alt={cat.titulo} fill priority={i === 0} className="object-cover" />
          </div>
          <div className="flex md:w-1/2 md:min-h-screen items-center px-6 py-16 md:px-16">
            <div className="max-w-md">
              <p className="text-xs tracking-widest uppercase text-manhattan">{cat.numero}</p>
              <h2 className="mt-3 font-serif text-4xl md:text-[57.6px] leading-[1] text-espresso">{cat.titulo}</h2>
              <p className="mt-6 max-w-sm text-muted">{cat.descripcion}</p>

              {cat.detalles ? (
                <>
                  <button
                    onClick={() => setAbierto(abierto === i ? null : i)}
                    className="mt-10 inline-flex items-center gap-3 text-xs tracking-widest uppercase text-tan"
                  >
                    Tratamientos Detalles
                    <span className="h-px w-8 bg-tan/60" />
                  </button>
                  {abierto === i && (
                    <div className="mt-4 divide-y divide-manhattan/40 border-t border-manhattan/40">
                      {cat.detalles.map((d, di) => (
                        <div key={d.titulo}>
                          <button
                            onClick={() => setAbierto(abierto === i ? null : i)}
                            className="flex w-full items-center justify-between py-5 text-left font-serif text-xl text-espresso"
                          >
                            {d.titulo}
                            <span className="text-tan">{di === 0 ? '−' : '+'}</span>
                          </button>
                          {di === 0 && (
                            <div className="pb-6">
                              <p className="text-sm text-muted">{d.descripcion}</p>
                              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                {d.columnaIzquierda && (
                                  <div>
                                    <p className="text-xs tracking-widest uppercase text-muted">{d.columnaIzquierda.titulo}</p>
                                    <ul className="mt-2 space-y-1 text-sm text-ink">
                                      {d.columnaIzquierda.items.map((it) => <li key={it}>• {it}</li>)}
                                    </ul>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs tracking-widest uppercase text-muted">{d.columnaDerecha.titulo}</p>
                                  <ul className="mt-2 space-y-1 text-sm text-ink">
                                    {d.columnaDerecha.items.map((it) => <li key={it}>+ {it}</li>)}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={onReservar}
                  className="mt-10 inline-flex items-center gap-3 text-xs tracking-widest uppercase text-tan hover:opacity-70"
                >
                  Tratamientos Detalles
                  <span className="h-px w-8 bg-tan/60" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
