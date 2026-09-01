export default function CtaFinal({ onReservar }: { onReservar: () => void }) {
  return (
    <section className="bg-espresso text-cream px-6 py-32 text-center">
      <p className="text-xs tracking-widest uppercase text-cream/60">Dé el primer paso</p>
      <h2 className="mt-6 font-serif text-5xl md:text-6xl">
        INICIE SU
        <br />
        <em className="italic text-tan">transformación</em>
      </h2>
      <p className="mx-auto mt-6 max-w-md text-cream/70">
        Agende una evaluación personalizada y descubra el tratamiento ideal
        para resaltar su belleza natural.
      </p>
      <button
        onClick={onReservar}
        className="mt-10 rounded-full border border-cream/40 px-10 py-4 text-xs tracking-widest uppercase hover:bg-cream/10 transition-colors"
      >
        Agenda tu cita
      </button>
    </section>
  );
}
