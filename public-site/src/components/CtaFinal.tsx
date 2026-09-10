export default function CtaFinal({ onReservar }: { onReservar: () => void }) {
  return (
    <section className="bg-[#1a1109] text-cream px-6 py-32 text-center">
      <p className="text-xs tracking-widest uppercase text-manhattan">Dé el primer paso</p>
      <h2 className="mt-6 font-serif text-5xl md:text-7xl xl:text-[80px] font-bold not-italic">
        INICIE SU
        <br />
        <em className="italic font-normal text-manhattan">transformación</em>
      </h2>
      <p className="mx-auto mt-6 max-w-md text-manhattan/[0.72]">
        Agende una evaluación personalizada y descubra el tratamiento ideal
        para resaltar su belleza natural.
      </p>
      <button
        onClick={onReservar}
        className="mt-10 rounded-full border border-manhattan text-manhattan px-10 py-4 text-xs tracking-widest uppercase hover:bg-manhattan/10 transition-colors"
      >
        Agenda tu cita
      </button>
    </section>
  );
}
