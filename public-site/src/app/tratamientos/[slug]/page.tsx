import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRATAMIENTOS, buscarTratamiento } from '@/lib/tratamientos';
import MarcoTratamiento from '@/components/tratamiento/MarcoTratamiento';
import BotonReservar from '@/components/tratamiento/BotonReservar';
import PreguntasFrecuentes from '@/components/tratamiento/PreguntasFrecuentes';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TRATAMIENTOS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const info = buscarTratamiento(slug);
  if (!info) return {};
  return { title: `${info.tratamiento.nombre} — Clinic NovagED`, description: info.tratamiento.resumen };
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-2xl text-espresso md:text-3xl">{children}</h2>;
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <section>
      <Titulo>{titulo}</Titulo>
      <ul className="mt-5 space-y-3 text-ink">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-relaxed">
            <span aria-hidden="true" className="text-tan">✦</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function PaginaTratamiento({ params }: Props) {
  const { slug } = await params;
  const info = buscarTratamiento(slug);
  if (!info) notFound();
  const { tratamiento: t, categoria, contexto, hermanos, imagen, credito } = info;

  return (
    <MarcoTratamiento>
      <article className="pt-[88px] md:pt-24">
        <header className="md:flex md:min-h-[70vh]">
          <div className="relative h-[45vh] md:h-auto md:w-1/2">
            <Image src={imagen} alt={t.nombre} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex items-center px-6 py-12 md:w-1/2 md:px-16">
            <div className="max-w-md">
              <nav aria-label="Ubicación en el sitio" className="text-xs uppercase tracking-widest text-muted">
                <Link href="/#tratamientos" className="hover:opacity-70">Tratamientos</Link>
                <span className="mx-2" aria-hidden="true">/</span>
                <span>{categoria.titulo}</span>
              </nav>
              <h1 className="mt-4 break-words font-serif text-4xl leading-[1.05] text-espresso md:text-[52px]">{t.nombre}</h1>
              <p className="mt-6 text-muted">{t.resumen}</p>
              <BotonReservar nombreServicio={t.nombre} className="mt-10" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-16 px-6 py-16 md:py-24">
          <section>
            <Titulo>Qué es</Titulo>
            {t.queEs.map((parrafo) => (
              <p key={parrafo} className="mt-5 leading-relaxed text-ink">{parrafo}</p>
            ))}
          </section>

          <Lista titulo="Beneficios" items={t.beneficios} />

          <div className="grid gap-16 md:grid-cols-2 md:gap-12">
            <Lista titulo="Antes del tratamiento" items={t.antes} />
            <Lista titulo="Después del tratamiento" items={t.despues} />
          </div>

          <Lista titulo="Contraindicaciones" items={t.contraindicaciones} />

          <section>
            <Titulo>Preguntas frecuentes</Titulo>
            <PreguntasFrecuentes preguntas={t.preguntas} />
          </section>

          <section className="rounded-2xl bg-neutral-cream px-6 py-10 text-center">
            <p className="font-serif text-2xl text-espresso">¿Te interesa este tratamiento?</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              En la consulta evaluamos tu caso y te recomendamos el protocolo adecuado para ti.
            </p>
            <BotonReservar nombreServicio={t.nombre} className="mt-8" />
          </section>

          {hermanos.length > 0 && (
            <section>
              <Titulo>Otros tratamientos de {contexto}</Titulo>
              <ul className="mt-6 flex flex-wrap gap-3">
                {hermanos.map((h) => (
                  <li key={h.slug} className="max-w-full">
                    <Link
                      href={`/tratamientos/${h.slug}`}
                      className="inline-block max-w-full rounded-full border border-tan/30 px-4 py-2 text-sm text-ink transition-colors hover:border-tan"
                    >
                      {h.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="border-t border-manhattan/40 pt-8 text-xs text-muted">
            <p>Información orientativa. No reemplaza la valoración médica personalizada.</p>
            <p className="mt-6 uppercase tracking-widest">Fuentes</p>
            <ul className="mt-3 space-y-2">
              {t.fuentes.map((f) => (
                <li key={f.url} className="break-words">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline decoration-manhattan underline-offset-2 hover:text-espresso">
                    {f.sitio} — {f.titulo}
                  </a>
                </li>
              ))}
            </ul>
            {credito && (
              <p className="mt-6 break-words">
                Foto:{' '}
                <a href={credito.url} target="_blank" rel="noopener noreferrer" className="underline decoration-manhattan underline-offset-2 hover:text-espresso">
                  {credito.autor} · {credito.sitio}
                </a>{' '}
                ({credito.licencia})
              </p>
            )}
          </footer>
        </div>
      </article>
    </MarcoTratamiento>
  );
}
