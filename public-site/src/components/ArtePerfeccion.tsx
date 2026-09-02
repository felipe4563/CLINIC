const puntos = [
  { n: '01', titulo: 'Resultados Naturales', texto: 'Evitamos el exceso, buscando siempre la elegancia de lo sutil.' },
  { n: '02', titulo: 'Trato Personalizado', texto: 'Cada rostro es único, por eso creamos planes a tu medida.' },
  { n: '03', titulo: 'Respaldo Médico', texto: 'Ciencia y tecnología de última generación a tu servicio.' },
  { n: '04', titulo: 'Acompañamiento', texto: 'Estamos contigo antes, durante y después del tratamiento.' },
];

export default function ArtePerfeccion({ onReservar }: { onReservar: () => void }) {
  return (
    <section className="bg-espresso text-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <div>
          <p className="text-xs tracking-widest uppercase text-cream/60">¿Por qué elegirnos?</p>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">
            El Arte de la
            <br />
            <em className="italic text-tan">Perfección</em>
          </h2>

          <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-10">
            {puntos.map((p) => (
              <div key={p.n}>
                <p className="text-cream/40">{p.n}</p>
                <h3 className="mt-2 font-serif text-lg">{p.titulo}</h3>
                <p className="mt-2 text-sm text-cream/70">{p.texto}</p>
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

        <div className="relative flex items-center">
          {/* PLACEHOLDER: replace with real photo of the product shelving / interior */}
          <div className="aspect-[4/5] w-full rounded-sm bg-cream/5" />
          <blockquote className="absolute inset-x-6 bottom-10 rounded-lg bg-espresso/90 p-8 shadow-xl md:inset-x-auto md:right-[-2rem] md:w-80">
            <p className="font-serif italic text-xl text-cream">
              &ldquo;La verdadera belleza reside en la armonía, no en el cambio
              drástico.&rdquo;
            </p>
            <footer className="mt-4 text-xs tracking-widest uppercase text-cream/60">
              — Filosofía NovagED
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
