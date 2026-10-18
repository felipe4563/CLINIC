'use client';
import MagneticButton from '../MagneticButton';
import Reveal from '../Reveal';

const CREDENCIALES = [
  { titulo: 'Colegio Médico', detalle: 'Miembro, Cochabamba' },
  { titulo: 'SEDES', detalle: 'Médica matriculada, Cochabamba' },
  { titulo: 'ASOBOME', detalle: 'Miembro, Cochabamba' },
  { titulo: 'Doble titulación', detalle: 'Colegio Médico de Lima, Perú' },
];

// Texto de la presentación de la doctora (el mismo de la web anterior).
export default function Doctora({ onReservar }: { onReservar: () => void }) {
  return (
    <section id="doctora" className="relative overflow-hidden bg-espresso-900 px-4 py-24 text-neutral-cream sm:px-8 md:py-32">
      <div className="aura -left-52 -top-60 h-[620px] w-[620px] bg-espresso opacity-55" />
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="flex flex-col gap-7">
          <p className="text-xs uppercase tracking-[0.22em] text-manhattan">Quién te atiende</p>
          <h2 className="font-serif text-[clamp(44px,5.4vw,84px)] font-light leading-[0.95] text-cream">
            Dra. Maria Noemi <em className="italic text-manhattan">Ponce Caisiri</em>
          </h2>
          <blockquote className="border-l border-manhattan/50 pl-6 font-serif text-[clamp(26px,2.6vw,36px)] font-light italic leading-snug">
            “En Clinic NovagED tu salud es nuestra prioridad.”
          </blockquote>
          <div>
            <MagneticButton>
              <button type="button" onClick={onReservar} className="min-h-12 rounded-full bg-cream px-7 text-[15px] text-espresso transition-colors hover:bg-white">
                Agenda tu evaluación con la doctora
              </button>
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-5 text-[16.5px] leading-relaxed">
          <p>
            Médico cirujano-ultrasonografista. Médico estético especialista en rejuvenecimiento y armonización facial y corporal, con técnicas avanzadas en
            armonización facial, antiedad, lifting, bioestimuladores de colágeno, fillers (ácido hialurónico), hilos, neuromodulación (toxina botulínica o
            Botox), enzimas recombinantes, enzimas lipolíticas y aparatología, con seguimiento médico especializado.
          </p>
          <p>
            Brinda tratamientos seguros, buscando resultados naturales y armónicos con protocolos personalizados para cada paciente. Clinic NovagED tiene un
            enfoque integral: suma ginecología, ecografía y fisioterapia, con compromiso y profesionalismo.
          </p>
          <ul className="mt-3 grid overflow-hidden rounded-3xl border border-manhattan/30 sm:grid-cols-2">
            {CREDENCIALES.map((c, i) => (
              <li
                key={c.titulo}
                className={`px-6 py-5 ${i % 2 === 0 ? 'sm:border-r' : ''} ${i < 2 ? 'border-b' : i === 2 ? 'border-b sm:border-b-0' : ''} border-manhattan/30`}
              >
                <p className="font-serif text-2xl text-cream">{c.titulo}</p>
                <p className="mt-0.5 text-sm text-manhattan">{c.detalle}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
