import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRATAMIENTOS, buscarTratamiento } from '@/lib/tratamientos';
import MarcoTratamiento from '@/components/tratamiento/MarcoTratamiento';
import BotonReservar from '@/components/tratamiento/BotonReservar';
import PreguntasFrecuentes from '@/components/tratamiento/PreguntasFrecuentes';
import TarjetaReserva from '@/components/tratamiento/TarjetaReserva';

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

function Titulo({ etiqueta, children }: { etiqueta?: string; children: ReactNode }) {
  return (
    <div>
      {etiqueta && <p className="text-[11px] uppercase tracking-[0.2em] text-tan">{etiqueta}</p>}
      <h2 className="mt-2 font-serif text-[clamp(30px,3vw,44px)] font-light leading-tight text-espresso">{children}</h2>
    </div>
  );
}

function Vinetas({ items, oscuro = false }: { items: string[]; oscuro?: boolean }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-relaxed">
          <span aria-hidden="true" className={oscuro ? 'text-manhattan' : 'text-tan'}>✦</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function PaginaTratamiento({ params }: Props) {
  const { slug } = await params;
  const info = buscarTratamiento(slug);
  if (!info) notFound();
  const { tratamiento: t, categoria, contexto, hermanos, imagen, credito } = info;

  return (
    <MarcoTratamiento>
      <article className="px-4 pb-24 pt-24 sm:px-8 md:pt-28 xl:px-12">
        <div className="mx-auto max-w-sitio">
          {/* Portada: foto en arco y título */}
          <header className="relative grid items-center gap-8 overflow-hidden rounded-[32px] bg-neutral-cream p-5 sm:p-8 md:rounded-[44px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:p-12">
            <div className="grano" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] sm:aspect-[16/10] lg:aspect-[4/4.2] lg:rounded-t-full lg:rounded-b-[28px]">
              <Image src={imagen} alt={credito ? t.nombre : ''} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="relative flex flex-col gap-6 lg:py-6">
              <nav aria-label="Ubicación en el sitio" className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-tan">
                <Link href="/#especialidades" className="hover:text-espresso">Tratamientos</Link>
                <span aria-hidden="true">/</span>
                <span>{categoria.titulo}</span>
                {contexto !== categoria.titulo && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{contexto}</span>
                  </>
                )}
              </nav>
              <h1 className="break-words font-serif text-[clamp(44px,6vw,96px)] font-light leading-[0.95] text-espresso">{t.nombre}</h1>
              <p className="max-w-xl text-lg leading-relaxed">{t.resumen}</p>
              {categoria.numero === '01' && (
                <ul className="flex flex-wrap gap-2 text-sm">
                  {['Evaluación médica previa', 'Consentimiento informado', 'Seguimiento con fotos'].map((s) => (
                    <li key={s} className="vidrio rounded-full px-4 py-2 text-espresso">{s}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-3">
                <BotonReservar nombreServicio={t.nombre} />
                <a href="#que-es" className="inline-flex min-h-12 items-center rounded-full border border-espresso px-7 text-[15px] text-espresso transition-colors hover:bg-espresso hover:text-cream">
                  Conocer el tratamiento
                </a>
              </div>
            </div>
          </header>

          {/* Contenido + tarjeta de reserva */}
          <div className="mt-12 grid items-start gap-10 md:mt-16 lg:grid-cols-[1fr_380px] lg:gap-14 2xl:grid-cols-[1fr_420px]">
            <div className="flex min-w-0 flex-col gap-6">
              <section id="que-es" className="rounded-[28px] bg-white p-7 sm:p-10">
                <Titulo etiqueta="El tratamiento">Qué es</Titulo>
                <div className="mt-5 grid gap-5 text-[16.5px] leading-relaxed xl:grid-cols-2 xl:gap-10">
                  {t.queEs.map((parrafo) => (
                    <p key={parrafo}>{parrafo}</p>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] bg-white p-7 sm:p-10">
                <Titulo etiqueta="Por qué elegirlo">Beneficios</Titulo>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {t.beneficios.map((b, i) => (
                    <li key={b} className="flex flex-col gap-3 rounded-2xl bg-cream p-5">
                      <span aria-hidden="true" className="font-serif text-3xl font-light leading-none text-manhattan">{String(i + 1).padStart(2, '0')}</span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-[28px] bg-neutral-cream p-7 sm:p-10">
                  <Titulo etiqueta="Prepárate">Antes del tratamiento</Titulo>
                  <Vinetas items={t.antes} />
                </section>
                <section className="rounded-[28px] bg-espresso p-7 text-neutral-cream sm:p-10">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-manhattan">Cuidados</p>
                  <h2 className="mt-2 font-serif text-[clamp(30px,3vw,44px)] font-light leading-tight text-cream">Después del tratamiento</h2>
                  <Vinetas items={t.despues} oscuro />
                </section>
              </div>

              <section className="rounded-[28px] border border-manhattan/60 p-7 sm:p-10">
                <Titulo etiqueta="Tu seguridad primero">Contraindicaciones</Titulo>
                <p className="mt-3 text-sm text-tan">Si alguna aplica a tu caso, cuéntaselo a la doctora en la evaluación.</p>
                <ul className="mt-5 grid gap-x-10 gap-y-3 md:grid-cols-2">
                  {t.contraindicaciones.map((c) => (
                    <li key={c} className="flex gap-3 leading-relaxed">
                      <span aria-hidden="true" className="text-tan">—</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[28px] bg-white p-7 sm:p-10">
                <Titulo etiqueta="Dudas">Preguntas frecuentes</Titulo>
                <PreguntasFrecuentes preguntas={t.preguntas} />
              </section>

              {hermanos.length > 0 && (
                <section className="rounded-[28px] bg-neutral-cream p-7 sm:p-10">
                  <Titulo etiqueta="Sigue explorando">También en {contexto}</Titulo>
                  <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                    {hermanos.map((h) => (
                      <li key={h.slug}>
                        <Link
                          href={`/tratamientos/${h.slug}`}
                          className="group flex min-h-12 items-center justify-between gap-3 border-b border-dotted border-tan/50 py-2.5 text-[15.5px] hover:text-espresso"
                        >
                          <span className="group-hover:underline group-hover:decoration-manhattan group-hover:underline-offset-4">{h.nombre}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="shrink-0 text-tan transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="px-2 text-xs text-muted">
                <p>Información orientativa. No reemplaza la valoración médica personalizada.</p>
                <p className="mt-5 uppercase tracking-widest">Fuentes</p>
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
                  <p className="mt-5 break-words">
                    Foto:{' '}
                    <a href={credito.url} target="_blank" rel="noopener noreferrer" className="underline decoration-manhattan underline-offset-2 hover:text-espresso">
                      {credito.autor} · {credito.sitio}
                    </a>{' '}
                    (
                    {credito.licenciaUrl ? (
                      <a href={credito.licenciaUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-manhattan underline-offset-2 hover:text-espresso">
                        {credito.licencia}
                      </a>
                    ) : (
                      credito.licencia
                    )}
                    )
                  </p>
                )}
              </footer>
            </div>

            {/* La columna se estira a todo el alto para que la tarjeta quede fija al bajar */}
            <aside aria-label="Reservar" className="lg:self-stretch">
              <TarjetaReserva nombre={t.nombre} />
            </aside>
          </div>
        </div>
      </article>
    </MarcoTratamiento>
  );
}
