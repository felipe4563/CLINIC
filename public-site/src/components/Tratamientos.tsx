'use client';
import { useState } from 'react';
import Image from 'next/image';

type Columna = { titulo: string; items: string[] };
type Grupo = { titulo: string; descripcion: string; columnas?: Columna[] };
type Categoria = { numero: string; titulo: string; descripcion: string; imagen: string; grupos: Grupo[] };

const categorias: Categoria[] = [
  {
    numero: '01',
    titulo: 'Medicina Estética',
    descripcion:
      'Tratamientos médico-estéticos avanzados orientados a la mejora visible, el rejuvenecimiento y el bienestar integral de la piel y el cuerpo.',
    imagen: '/novaged-assets/medicinaEstetica-DQhnxto0.png',
    grupos: [
      {
        titulo: 'Tratamientos Faciales',
        descripcion:
          'Tratamientos orientados a mejorar la calidad, hidratación, luminosidad y regeneración de la piel mediante medicina estética avanzada.',
        columnas: [
          { titulo: 'Áreas de enfoque', items: ['Calidad de piel', 'Hidratación profunda', 'Despigmentación', 'Regeneración celular'] },
          { titulo: 'Tratamientos', items: ['Microneedling', 'PRP facial', 'PDRN / PN', 'Exosomas', 'Peelings médicos', 'Ácido hialurónico', 'Coctel de vitaminas', 'DMAE + silicio orgánico', 'Cóctel de aminoácidos'] },
        ],
      },
      {
        titulo: 'Armonización Facial',
        descripcion: 'Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.',
        columnas: [
          { titulo: 'Procedimientos', items: ['Ácido hialurónico (Fillers)', 'Toxina botulínica (Botox)', 'Perfilado de nariz', 'Relleno / perfilado de labios', 'Mentoplastia', 'Marcación mandibular', 'Levantamiento de pómulos'] },
        ],
      },
      {
        titulo: 'Rejuvenecimiento · Lifting',
        descripcion: 'Protocolos regenerativos orientados a combatir flacidez y signos de envejecimiento facial.',
        columnas: [
          { titulo: 'Indicados para', items: ['Flacidez facial', 'Envejecimiento', 'Grasa localizada'] },
          { titulo: 'Tratamiento con bioestimuladores de colágeno', items: ['Hidroxiapatita de calcio', 'Ácido poliláctico', 'Hilos tensores', 'Bioestimuladores de colágeno', 'Adipoestructuración'] },
        ],
      },
      {
        titulo: 'Tratamientos Corporales',
        descripcion: 'Tratamientos orientados a mejorar contorno corporal, firmeza y reducción de grasa localizada.',
        columnas: [
          { titulo: 'Tratamientos disponibles', items: ['Lipólisis química', 'Enzimas recombinantes', 'Enzimas lipolíticas', 'Ondas rusas', 'Radiofrecuencia', 'Drenaje linfático', 'Masajes reductores'] },
        ],
      },
      {
        titulo: 'Plasma Láser',
        descripcion: 'Tecnología orientada al rejuvenecimiento y corrección de imperfecciones cutáneas.',
        columnas: [
          { titulo: 'Indicados para', items: ['Blefaroplastia sin cirugía', 'Lifting facial sin cirugía', 'Eliminación de lunares', 'Eliminación de acrocordones', 'Eliminación de verrugas'] },
        ],
      },
    ],
  },
  {
    numero: '02',
    titulo: 'Ginecología y Obstetricia',
    descripcion: 'Atención integral femenina con enfoque preventivo, diagnóstico y seguimiento especializado.',
    imagen: '/novaged-assets/ginecologia-BjPYN0D4.png',
    grupos: [
      { titulo: 'Consulta ginecológica', descripcion: 'Evaluación ginecológica completa con historial clínico y examen físico.' },
      { titulo: 'Obstetricia', descripcion: 'Seguimiento especializado del embarazo, parto y puerperio.' },
      { titulo: 'Planificación familiar', descripcion: 'Orientación y prescripción de métodos anticonceptivos adecuados.' },
      { titulo: 'Control prenatal', descripcion: 'Monitoreo periódico del desarrollo del embarazo y bienestar materno-fetal.' },
      { titulo: 'Papanicolau', descripcion: 'Citología cervical para detección temprana de alteraciones celulares.' },
      { titulo: 'Colposcopía', descripcion: 'Examen visual del cuello uterino para evaluación y diagnóstico especializado.' },
    ],
  },
  {
    numero: '03',
    titulo: 'Ecografía',
    descripcion: 'Servicios de diagnóstico por imagen orientados a evaluación médica precisa y especializada.',
    imagen: '/novaged-assets/ecografia-De6bdoYN.png',
    grupos: [
      { titulo: 'Ecografía abdominal', descripcion: 'Evaluación de órganos y estructuras abdominales mediante ultrasonido.' },
      { titulo: 'Ecografía ginecológica', descripcion: 'Diagnóstico de estructuras pélvicas y reproductivas femeninas.' },
      { titulo: 'Ecografía de partes blandas', descripcion: 'Valoración de tejidos blandos superficiales y ganglios.' },
      { titulo: 'Ecografía musculoesquelética', descripcion: 'Diagnóstico de tendones, músculos, ligamentos y articulaciones.' },
    ],
  },
  {
    numero: '04',
    titulo: 'Fisioterapia',
    descripcion: 'Tratamientos terapéuticos orientados a rehabilitación, bienestar físico y recuperación funcional.',
    imagen: '/novaged-assets/fisioterapia-Dya6snx4.png',
    grupos: [
      { titulo: 'Terapia manual', descripcion: 'Técnicas manuales especializadas para alivio del dolor y recuperación funcional.' },
      { titulo: 'Masajes relajantes', descripcion: 'Sesiones orientadas a reducir tensión muscular y promover bienestar general.' },
      { titulo: 'Masajes descontracturantes', descripcion: 'Trabajo profundo sobre contracturas y tensiones musculares acumuladas.' },
      { titulo: 'Rehabilitación', descripcion: 'Protocolos personalizados para recuperación funcional post-lesión o cirugía.' },
      { titulo: 'Aparatología', descripcion: 'Tratamientos con equipos especializados de fisioterapia según indicación médica.' },
    ],
  },
  {
    numero: '05',
    titulo: 'Enfermería',
    descripcion: 'Servicios básicos de apoyo clínico y control médico.',
    imagen: '/novaged-assets/enfermeria-BQQNcDdH.png',
    grupos: [
      { titulo: 'Curaciones', descripcion: 'Tratamiento y seguimiento de heridas y lesiones cutáneas.' },
      { titulo: 'Control de presión arterial', descripcion: 'Medición y registro de valores de tensión arterial.' },
      { titulo: 'Control de peso y talla', descripcion: 'Evaluación antropométrica básica.' },
      { titulo: 'Glicemia capilar', descripcion: 'Medición de glucosa en sangre capilar con glucómetro calibrado.' },
      { titulo: 'Sueros', descripcion: 'Administración de soluciones intravenosas según prescripción médica.' },
      { titulo: 'Inyectables', descripcion: 'Aplicación de medicamentos por vía intramuscular o endovenosa.' },
    ],
  },
];

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-tan transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function Tratamientos() {
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const [grupoAbierto, setGrupoAbierto] = useState<Record<number, number | null>>({});

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

              <button
                onClick={() => setDetalleAbierto(detalleAbierto === i ? null : i)}
                className="mt-10 inline-flex items-center gap-3 text-xs tracking-widest uppercase text-tan hover:opacity-70"
              >
                {detalleAbierto === i ? 'Cerrar' : 'Tratamientos Detalles'}
                <span className="h-px w-8 bg-tan/60" />
              </button>

              {detalleAbierto === i && (
                <div className="mt-4 divide-y divide-manhattan/40 border-t border-manhattan/40">
                  {cat.grupos.map((g, gi) => {
                    const abierto = grupoAbierto[i] === gi;
                    return (
                      <div key={g.titulo}>
                        <button
                          onClick={() => setGrupoAbierto((prev) => ({ ...prev, [i]: prev[i] === gi ? null : gi }))}
                          className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-xl text-espresso"
                        >
                          {g.titulo}
                          <Chevron abierto={abierto} />
                        </button>
                        {abierto && (
                          <div className="pb-6">
                            <p className="text-sm text-muted">{g.descripcion}</p>
                            {g.columnas && (
                              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                {g.columnas.map((col) => (
                                  <div key={col.titulo}>
                                    <p className="text-xs tracking-widest uppercase text-muted">{col.titulo}</p>
                                    <ul className="mt-2 space-y-1 text-sm text-ink">
                                      {col.items.map((it) => (
                                        <li key={it}>✦ {it}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
