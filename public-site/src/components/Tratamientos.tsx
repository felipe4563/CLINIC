'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import Chevron from './Chevron';
import { CATEGORIAS } from '@/lib/tratamientos/categorias';
import type { Icono } from '@/lib/tratamientos/tipos';

function IconoCategoria({ tipo }: { tipo: Icono }) {
  const props = {
    className: 'h-4 w-4 text-tan',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (tipo) {
    case 'pulso':
      return (
        <svg {...props}>
          <path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z" />
        </svg>
      );
    case 'onda':
      return (
        <svg {...props}>
          <path d="M2 12h3l2-7 3 14 3-11 2 4h7" />
        </svg>
      );
    case 'movimiento':
      return (
        <svg {...props}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v6l-3 8M12 13l3 8M9 10l-4 2M15 10l4 2" />
        </svg>
      );
    case 'cruz':
      return (
        <svg {...props}>
          <path d="M12 4v16M4 12h16" />
        </svg>
      );
  }
}

export default function Tratamientos() {
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const [grupoAbierto, setGrupoAbierto] = useState<Record<number, number | null>>({});

  return (
    <section id="tratamientos" className="bg-cream">
      {CATEGORIAS.map((cat, i) => (
        <div key={cat.titulo} className="relative md:flex md:min-h-screen">
          <div className={`relative h-[60vh] md:h-screen md:w-1/2 md:sticky md:top-0 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
            <Image src={cat.imagen} alt={cat.titulo} fill priority={i === 0} className="object-cover" />
          </div>
          <div
            className={`flex md:w-1/2 md:min-h-screen items-center px-6 py-16 md:px-16 ${
              cat.icono ? 'bg-pearl' : ''
            }`}
          >
            <div className="max-w-md">
              <div className="flex items-center gap-2">
                {cat.icono && <IconoCategoria tipo={cat.icono} />}
                <p className="text-xs tracking-widest uppercase text-manhattan">{cat.numero}</p>
              </div>
              <h2 className="mt-3 font-serif text-4xl md:text-[57.6px] leading-[1] text-espresso">{cat.titulo}</h2>
              <p className="mt-6 max-w-sm text-muted">{cat.descripcion}</p>
              {cat.respaldo && (
                <p className="mt-4 max-w-sm border-t border-manhattan/30 pt-4 text-xs text-muted">{cat.respaldo}</p>
              )}

              <button
                onClick={() => setDetalleAbierto(detalleAbierto === i ? null : i)}
                className="mt-10 inline-flex items-center gap-3 text-xs tracking-widest uppercase text-tan hover:opacity-70"
              >
                {detalleAbierto === i ? 'Cerrar' : 'Tratamientos Detalles'}
                <span className="h-px w-8 bg-tan/60" />
              </button>

              {detalleAbierto === i && (
                <div className="mt-4 divide-y divide-manhattan/40 border-t border-manhattan/40">
                  {cat.grupos.map((g, gi) => {
                    const abierto = grupoAbierto[i] === gi;
                    return (
                      <div key={g.titulo}>
                        <button
                          onClick={() => setGrupoAbierto((prev) => ({ ...prev, [i]: prev[i] === gi ? null : gi }))}
                          className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-xl text-espresso"
                        >
                          {g.titulo}
                          <Chevron abierto={abierto} />
                        </button>
                        {abierto && (
                          <div className="pb-6">
                            <p className="text-sm text-muted">{g.descripcion}</p>
                            {g.slug && (
                              <Link
                                href={`/tratamientos/${g.slug}`}
                                className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-tan hover:opacity-70"
                              >
                                Ver tratamiento <span aria-hidden="true">→</span>
                              </Link>
                            )}
                            {g.columnas && (
                              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                {g.columnas.map((col) => (
                                  <div key={col.titulo}>
                                    <p className="text-xs tracking-widest uppercase text-muted">{col.titulo}</p>
                                    <ul className="mt-2 space-y-1 text-sm text-ink">
                                      {col.items.map((it) => (
                                        <li key={it.nombre}>
                                          {it.slug ? (
                                            <Link href={`/tratamientos/${it.slug}`} className="group inline-flex items-baseline gap-1 hover:text-tan">
                                              ✦ {it.nombre}
                                              <span aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">→</span>
                                            </Link>
                                          ) : (
                                            <>✦ {it.nombre}</>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
