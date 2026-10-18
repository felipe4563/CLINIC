import Reveal from '../Reveal';

const PASOS = [
  {
    titulo: 'Reservas en línea',
    texto: 'Eliges tratamiento, día y hora. Aseguras tu horario pagando con QR el 50 % como adelanto o el total; el saldo lo pagas en la clínica.',
  },
  {
    titulo: 'Evaluación con la doctora',
    texto: 'Arma tu historia clínica: antecedentes, fototipo y estado de tu piel, y lo que quieres lograr. Te propone un plan realista.',
  },
  {
    titulo: 'Tratamiento con consentimiento',
    texto: 'Antes de empezar lees y firmas tu consentimiento informado, con los cuidados y lo que puedes esperar.',
  },
  {
    titulo: 'Control y seguimiento',
    texto: 'Cada control queda registrado con fotos en tu historia, y te llevas por escrito los cuidados para casa.',
  },
];

export default function PrimeraVisita() {
  return (
    <section id="visita" className="bg-neutral-cream px-4 pb-24 sm:px-8 md:pb-32">
      <div className="mx-auto grid max-w-7xl items-start gap-12 rounded-[32px] bg-cream p-7 sm:p-12 md:rounded-[44px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:p-16">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-tan">Tu primera visita</p>
          <h2 className="mt-5 font-serif text-[clamp(40px,5vw,72px)] font-light leading-[0.95] text-espresso">
            Sin sorpresas, <em className="italic">de principio a fin</em>
          </h2>
          <p className="mt-6 max-w-md">Sabes qué pasa antes, durante y después. Si es tu primera vez, empieza con una consulta de evaluación.</p>
        </Reveal>
        <ol className="relative">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className={`relative ml-6 grid grid-cols-[48px_1fr] gap-4 sm:gap-6 ${i < PASOS.length - 1 ? 'border-l border-manhattan pb-9' : ''}`}>
              <span
                aria-hidden="true"
                className={`-ml-[25px] flex h-12 w-12 items-center justify-center rounded-full font-serif text-xl ${i < PASOS.length - 1 ? 'bg-espresso text-cream' : 'bg-manhattan text-espresso-900'}`}
              >
                {i + 1}
              </span>
              <Reveal delay={i * 0.08}>
                <h3 className="text-xl text-espresso">{p.titulo}</h3>
                <p className="mt-1.5 text-[15.5px] leading-relaxed">{p.texto}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
