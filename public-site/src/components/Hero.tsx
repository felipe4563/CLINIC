import Image from 'next/image';

export default function Hero({ onReservar }: { onReservar: () => void }) {
  return (
    <section id="top" className="relative min-h-screen flex items-end bg-espresso text-cream overflow-hidden">
      <Image
        src="/novaged-assets/fondoImagen-C2baLwir.png"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/[0.58]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 pb-20 pt-40">
        <h1 className="font-serif text-5xl md:text-[69px] xl:text-[130px] leading-[0.88] tracking-[-0.03em]">
          Esculpir la
          <br />
          <em className="italic">Esencia</em>
        </h1>
        <p className="mt-8 max-w-md text-cream/80">
          Arquitectura facial y medicina estética avanzada diseñada para revelar
          la belleza intrínseca que reside en el equilibrio.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={onReservar}
            className="rounded-full bg-cream text-espresso text-xs tracking-widest uppercase px-8 py-4 hover:opacity-85 transition-opacity"
          >
            Agenda tu consulta
          </button>
          <a
            href="#tratamientos"
            className="rounded-full border border-cream/40 text-cream text-xs tracking-widest uppercase px-8 py-4 hover:border-cream/80 transition-colors"
          >
            Conocer más
          </a>
        </div>
        <div className="mt-16 flex items-center gap-4 text-cream/70">
          <span className="h-px w-10 bg-cream/40" />
          <em className="italic font-serif">Boutique Medical Excellence</em>
        </div>
        <a href="#esencia" className="mt-4 inline-block text-xs tracking-widest uppercase text-cream/70">
          Descubre tratamientos ↓
        </a>
      </div>
    </section>
  );
}
