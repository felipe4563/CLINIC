import Image from 'next/image';

const puntos = [
  { n: '01', titulo: 'Resultados Naturales', texto: 'Evitamos el exceso, buscando siempre la elegancia de lo sutil.' },
  { n: '02', titulo: 'Trato Personalizado', texto: 'Cada rostro es único, por eso creamos planes a tu medida.' },
  { n: '03', titulo: 'Respaldo Médico', texto: 'Ciencia y tecnología de última generación a tu servicio.' },
  { n: '04', titulo: 'Acompañamiento', texto: 'Estamos contigo antes, durante y después del tratamiento.' },
];

export default function ArtePerfeccion({ onReservar }: { onReservar: () => void }) {
  return (
    <section className="bg-[#2d241e] text-cream md:flex md:min-h-screen">
      <div className="flex md:min-h-screen md:w-1/2 items-center px-6 py-20 md:px-16">
        <div>
          <p className="text-xs tracking-widest uppercase text-manhattan/60">¿Por qué elegirnos?</p>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">
            El Arte de la
            <br />
            <em className="italic text-manhattan">Perfección</em>
          </h2>

          <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-10">
            {puntos.map((p) => (
              <div key={p.n}>
                <p className="text-manhattan/25">{p.n}</p>
                <h3 className="mt-2 font-serif text-lg">{p.titulo}</h3>
                <p className="mt-2 text-sm text-manhattan">{p.texto}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onReservar}
            className="mt-12 inline-block text-xs tracking-widest uppercase border-b border-cream/40 pb-1"
          >
            Iniciar Transformación
          </button>
        </div>
      </div>

      <div className="relative h-[60vh] md:h-auto md:w-1/2">
        <Image
          src="/novaged-assets/perfeccion-kIRxN5hD.png"
          alt="Interior de Clinic NovagED"
          fill
          className="object-cover"
        />
        <blockquote className="absolute inset-x-6 bottom-10 rounded-lg bg-[#2d241e]/90 p-8 shadow-xl backdrop-blur-sm md:inset-x-auto md:left-10 md:right-auto md:w-80">
          <p className="font-serif italic text-xl text-cream">
            &ldquo;La verdadera belleza reside en la armonía, no en el cambio
            drástico.&rdquo;
          </p>
          <footer className="mt-4 text-xs tracking-widest uppercase text-cream/40">
            — Filosofía NovagED
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
