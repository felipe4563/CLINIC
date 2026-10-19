'use client';
import Image from 'next/image';
import Link from 'next/link';
import { buscarTratamiento } from '@/lib/tratamientos';
import Reveal from '../Reveal';

const DESTACADOS = [
  { slug: 'toxina-botulinica', tipo: 'Armonización' },
  { slug: 'microneedling', tipo: 'Facial' },
  { slug: 'relleno-de-labios', tipo: 'Armonización' },
  { slug: 'peelings-medicos', tipo: 'Facial' },
].flatMap((d) => {
  const info = buscarTratamiento(d.slug);
  return info ? [{ ...d, nombre: info.tratamiento.nombre, resumen: info.tratamiento.resumen, imagen: info.imagen }] : [];
});

// Cuatro tratamientos con foto. En pantallas con mouse el resumen aparece al pasar
// el cursor; en el celular se ve siempre y las tarjetas se deslizan de lado.
export default function MasBuscados() {
  return (
    <section id="destacados" className="relative rounded-t-[40px] bg-neutral-cream px-4 py-24 sm:px-8 xl:px-12 md:rounded-t-[56px] md:py-32">
      <div className="grano rounded-t-[40px] md:rounded-t-[56px]" />
      <div className="relative mx-auto max-w-sitio">
        <Reveal className="mb-12 grid items-end gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-tan">Los más buscados</p>
            <h2 className="mt-5 font-serif text-[clamp(44px,6vw,92px)] font-light leading-[0.92] text-espresso">
              Resultados que <em className="italic">se ven naturales</em>
            </h2>
          </div>
          <p className="max-w-md lg:justify-self-end">Qué es cada uno, sus beneficios y todo lo que conviene saber antes y después, explicado en su página.</p>
        </Reveal>

        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-5">
          {DESTACADOS.map((d, i) => (
              <li key={d.slug} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                <Reveal delay={i * 0.08}>
                  <Link
                    href={`/tratamientos/${d.slug}`}
                    className="group relative block aspect-[3/4.3] overflow-hidden rounded-t-full rounded-b-3xl text-cream"
                  >
                    <Image src={d.imagen} alt={d.nombre} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw" className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-b from-transparent from-30% to-espresso-900/90" />
                    <span className="absolute inset-x-0 bottom-0 p-6">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-manhattan">
                        {d.tipo}
                      </span>
                      <span className="mt-1.5 block font-serif text-3xl font-light leading-[1.05]">{d.nombre}</span>
                      <span className="mt-2 block text-sm leading-snug text-neutral-cream transition-all duration-500 [@media(hover:hover)]:max-h-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:max-h-40 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:max-h-40 [@media(hover:hover)]:group-focus-visible:opacity-100">
                        {d.resumen}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-2 text-[13px] text-manhattan">
                        Ver tratamiento
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <a href="#especialidades" className="inline-flex min-h-12 items-center rounded-full border border-espresso px-7 text-[15px] text-espresso transition-colors hover:bg-espresso hover:text-cream">
            Ver la carta completa
          </a>
        </div>
      </div>
    </section>
  );
}
