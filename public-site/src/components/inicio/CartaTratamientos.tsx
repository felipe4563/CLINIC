'use client';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CARTA, TOTAL_TRATAMIENTOS } from '@/lib/cartaInicio';
import { duracionDe, useDuraciones } from '@/lib/useDatosClinica';
import Reveal from '../Reveal';

// Foto y frase de cada especialidad, en el orden de CARTA.
const PORTADAS = [
  { foto: '/tratamientos/microneedling.jpg', frase: 'Calidad de la piel, armonización, rejuvenecimiento, contorno corporal y plasma.' },
  { foto: '/tratamientos/consulta-ginecologica.jpg', frase: 'La salud de la mujer en cada etapa, con ecografía en el mismo consultorio.' },
  { foto: '/tratamientos/ecografia-ginecologica.jpg', frase: 'Realizada por la misma médica ultrasonografista que te atiende.' },
  { foto: '/tratamientos/masajes-relajantes.jpg', frase: 'Para soltar tensiones, recuperar movimiento y complementar tus tratamientos corporales.' },
  { foto: '/tratamientos/sueros.jpg', frase: 'Procedimientos rápidos, con indicación médica cuando corresponde.' },
];

export default function CartaTratamientos() {
  const base = useId();
  const reducir = useReducedMotion();
  const duraciones = useDuraciones();
  const [activa, setActiva] = useState(0);
  const pestanas = useRef<(HTMLButtonElement | null)[]>([]);
  const esp = CARTA[activa];

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const mover = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let destino: number | null = mover ? (i + mover + CARTA.length) % CARTA.length : null;
    if (e.key === 'Home') destino = 0;
    if (e.key === 'End') destino = CARTA.length - 1;
    if (destino === null) return;
    e.preventDefault();
    setActiva(destino);
    pestanas.current[destino]?.focus();
  }

  return (
    <section id="especialidades" className="px-4 py-24 sm:px-8 xl:px-12 md:py-32">
      <div className="mx-auto max-w-sitio">
        <Reveal className="mb-12 grid items-end gap-6 md:mb-16 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-tan">Carta de tratamientos</p>
            <h2 className="mt-5 font-serif text-[clamp(44px,6vw,92px)] font-light leading-[0.92] text-espresso">
              Cinco especialidades, <em className="italic">un solo lugar</em>
            </h2>
          </div>
          <p className="max-w-md lg:justify-self-end">
            {TOTAL_TRATAMIENTOS} tratamientos con la misma médica y la misma historia clínica. Elige una especialidad para ver su carta completa y el tiempo de cada sesión.
          </p>
        </Reveal>

        <div className="grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div
            role="tablist"
            aria-label="Especialidades"
            aria-orientation="vertical"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b lg:border-manhattan/60 lg:px-0 lg:pb-0"
          >
            {CARTA.map((e, i) => {
              const sel = i === activa;
              return (
                <button
                  key={e.numero}
                  ref={(el) => {
                    pestanas.current[i] = el;
                  }}
                  role="tab"
                  id={`${base}-tab${i}`}
                  aria-selected={sel}
                  aria-controls={`${base}-panel`}
                  tabIndex={sel ? 0 : -1}
                  onClick={() => setActiva(i)}
                  onKeyDown={(ev) => alTeclear(ev, i)}
                  className={`group shrink-0 rounded-full border px-5 py-3 text-left transition-all duration-300 lg:grid lg:grid-cols-[56px_1fr_auto] lg:items-baseline lg:gap-3 lg:rounded-none lg:border-0 lg:border-t lg:border-manhattan/60 lg:px-0 lg:py-6 ${
                    sel ? 'border-espresso bg-espresso text-cream lg:bg-transparent lg:pl-4 lg:text-espresso' : 'border-manhattan/70 text-tan hover:text-espresso'
                  }`}
                >
                  <span className="hidden font-serif text-lg lg:inline">{e.numero}</span>
                  <span className="whitespace-nowrap text-[15px] lg:whitespace-normal lg:font-serif lg:text-[clamp(28px,3vw,42px)] lg:font-light lg:leading-[1.1]">{e.titulo}</span>
                  <span className="ml-2 text-xs opacity-80 lg:ml-0 lg:text-[13px]">{e.total}</span>
                </button>
              );
            })}
          </div>

          <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab${activa}`} className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activa}
                initial={reducir ? undefined : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducir ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[32px] bg-white p-6 shadow-[0_40px_80px_-60px_rgba(45,36,30,0.5)] sm:p-10"
              >
                <div className="mb-8 flex flex-wrap items-center gap-6">
                  <div className="arco relative aspect-[3/4] w-24 shrink-0 sm:w-28">
                    <Image src={PORTADAS[activa].foto} alt="" fill sizes="112px" className="object-cover" />
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <h3 className="font-serif text-4xl font-light leading-tight text-espresso">{esp.titulo}</h3>
                    <p className="mt-2 text-[15px]">{PORTADAS[activa].frase}</p>
                  </div>
                </div>

                <div className={esp.secciones.length > 1 ? 'grid gap-x-10 gap-y-8 md:grid-cols-2' : ''}>
                  {esp.secciones.map((s) => (
                    <div key={s.titulo ?? esp.titulo}>
                      {s.titulo && <h4 className="mb-2 text-[11px] uppercase tracking-[0.2em] text-tan">{s.titulo}</h4>}
                      <ul>
                        {s.items.map((it) => {
                          const min = duracionDe(duraciones, it.nombreServicio);
                          return (
                            <li key={it.slug}>
                              <Link
                                href={`/tratamientos/${it.slug}`}
                                className="group/item flex items-baseline justify-between gap-4 border-b border-dotted border-tan/40 py-2.5 transition-colors hover:text-espresso"
                              >
                                <span className="min-w-0">
                                  <span className="text-[15.5px] group-hover/item:underline group-hover/item:decoration-manhattan group-hover/item:underline-offset-4">{it.nombre}</span>
                                  {it.descripcion && <span className="mt-0.5 block text-sm text-tan">{it.descripcion}</span>}
                                </span>
                                <span className="flex shrink-0 items-center gap-2 text-[13px] text-tan">
                                  {min ? `${min} min` : ''}
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="transition-transform group-hover/item:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
