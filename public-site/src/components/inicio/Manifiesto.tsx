import Reveal from '../Reveal';

// Lo que hace distinta a la clínica, contado con lo que el sistema realmente registra:
// historia clínica, consentimiento firmado y fotos de seguimiento.
const PILARES = [
  { titulo: 'Historia clínica completa', texto: 'Antecedentes, alergias, medicamentos y un análisis de tu piel antes de cualquier procedimiento.' },
  { titulo: 'Consentimiento informado', texto: 'Te explicamos por escrito los riesgos, los beneficios y los cuidados, y firmas solo cuando estás segura.' },
  { titulo: 'Fotos de seguimiento', texto: 'Registramos el antes y cada control, para que veas tu evolución con datos y no con impresiones.' },
];

export default function Manifiesto() {
  return (
    <section className="px-4 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-tan">Nuestra forma de trabajar</p>
          <p className="mt-7 font-serif text-[clamp(32px,4.4vw,60px)] font-light leading-[1.15] text-espresso">
            Primero tu <em className="italic">salud</em>, después el resultado. Creemos en una estética <em className="italic">natural</em>, planificada por una
            médica y con un <em className="italic">seguimiento</em> de cada sesión.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {PILARES.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 0.1} className="flex flex-col gap-3">
              <span aria-hidden="true" className="font-serif text-6xl font-light leading-none text-manhattan">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-xl font-normal text-espresso">{p.titulo}</h3>
              <p className="text-[15px] leading-relaxed">{p.texto}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
