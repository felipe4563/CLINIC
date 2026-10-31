'use client';
import Image from 'next/image';
import Link from 'next/link';
import MagneticButton from '../MagneticButton';
import Reveal from '../Reveal';
import { parrafos, separarNombre } from '@/lib/equipo';
import { DOCTORA_RESPALDO, fotoSrc, useEquipo } from '@/lib/useEquipo';
import type { MiembroEquipo } from '@/lib/types';

// Foto en arco, como el isotipo del logo. Sin foto, el isotipo sobre crema.
export function FotoArco({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`arco relative overflow-hidden bg-neutral-cream ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-top" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <Image src="/novaged-assets/isotipo-chocolate.png" alt="" width={46} height={80} className="opacity-40" />
        </span>
      )}
    </div>
  );
}

function Credenciales({ lista }: { lista: { titulo: string; detalle: string }[] }) {
  if (!lista.length) return null;
  return (
    // Las líneas entre celdas son el fondo que asoma por el gap de 1px.
    <ul className="mt-3 grid gap-px overflow-hidden rounded-3xl border border-manhattan/30 bg-manhattan/30 sm:grid-cols-2">
      {lista.map((c, i) => (
        <li key={`${c.titulo}-${i}`} className={`bg-espresso-900 px-6 py-5 ${lista.length % 2 === 1 && i === lista.length - 1 ? 'sm:col-span-2' : ''}`}>
          {c.titulo && <p className="font-serif text-2xl text-cream">{c.titulo}</p>}
          {c.detalle && <p className="mt-0.5 text-sm text-arena">{c.detalle}</p>}
        </li>
      ))}
    </ul>
  );
}

// "Nuestro equipo": el primero del orden (la doctora) en grande y el resto en tarjetas.
// Se carga desde el panel; mientras la doctora no tenga su perfil, se muestra el texto de siempre.
export default function Equipo({ onReservar }: { onReservar: () => void }) {
  const lista = useEquipo();
  const [principal, ...resto] = lista ?? [];

  const datos = principal
    ? {
        nombre: principal.nombre,
        cargo: principal.cargo || principal.especialidad || '',
        foto: fotoSrc(principal.foto_url),
        parrafos: parrafos(principal.biografia).slice(0, 2),
        formacion: principal.formacion.slice(0, 4),
        slug: principal.slug as string | null,
      }
    : { ...DOCTORA_RESPALDO, slug: null };
  const [inicio, final] = separarNombre(datos.nombre);

  return (
    <section id="equipo" className="relative overflow-hidden bg-espresso-900 px-4 py-24 text-neutral-cream sm:px-8 xl:px-12 md:py-32">
      <span id="doctora" className="absolute top-0" aria-hidden="true" />
      <div className="aura -left-52 -top-60 h-[620px] w-[620px] bg-espresso opacity-55" />
      <div className="relative mx-auto max-w-sitio">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-arena">Quién te atiende</p>
            <h2 className="mt-4 font-serif text-[clamp(48px,6vw,96px)] font-light leading-[0.92] text-cream">
              Nuestro <em className="italic text-arena">equipo</em>
            </h2>
          </div>
          <p className="max-w-md text-[16.5px] leading-relaxed">
            Profesionales de la salud que te evalúan antes de cada tratamiento y te acompañan en el seguimiento.
          </p>
        </Reveal>

        {/* Principal */}
        <div className="mt-14 grid items-center gap-12 md:mt-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal className="mx-auto w-full max-w-[420px]">
            <FotoArco src={datos.foto} alt={`${datos.nombre}, Clinic NovagED`} className="aspect-[4/5] w-full shadow-[0_60px_90px_-60px_rgba(0,0,0,0.9)]" />
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-6">
            <div>
              <h3 className="font-serif text-[clamp(40px,4.6vw,72px)] font-light leading-[0.95] text-cream">
                {inicio} {final && <em className="italic text-arena">{final}</em>}
              </h3>
              {datos.cargo && <p className="mt-3 text-[13px] uppercase tracking-[0.18em] text-arena">{datos.cargo}</p>}
            </div>
            <div className="flex flex-col gap-4 text-[16.5px] leading-relaxed">
              {datos.parrafos.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <Credenciales lista={datos.formacion} />
            <div className="mt-2 flex flex-wrap gap-3">
              <MagneticButton>
                <button type="button" onClick={onReservar} className="min-h-12 rounded-full bg-cream px-7 text-[15px] text-espresso transition-colors hover:bg-white">
                  Agenda tu evaluación
                </button>
              </MagneticButton>
              {datos.slug && (
                <Link
                  href={`/equipo/${datos.slug}`}
                  className="inline-flex min-h-12 items-center rounded-full border border-manhattan px-7 text-[15px] text-cream transition-colors hover:bg-white/10"
                >
                  Ver perfil completo
                </Link>
              )}
            </div>
          </Reveal>
        </div>

        {/* Resto del equipo */}
        {resto.length > 0 && (
          <ul className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {resto.map((m, i) => (
              <li key={m.id}>
                <Reveal delay={0.05 * i} className="h-full">
                  <TarjetaMiembro miembro={m} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TarjetaMiembro({ miembro }: { miembro: MiembroEquipo }) {
  return (
    <Link
      href={`/equipo/${miembro.slug}`}
      className="group flex h-full items-center gap-5 rounded-[28px] border border-manhattan/25 bg-espresso/60 p-5 transition-colors hover:border-manhattan/60 hover:bg-espresso"
    >
      <FotoArco src={fotoSrc(miembro.foto_url)} alt="" className="h-28 w-[88px] shrink-0" />
      <span className="min-w-0">
        <span className="block font-serif text-2xl leading-tight text-cream">{miembro.nombre}</span>
        {(miembro.cargo || miembro.especialidad) && (
          <span className="mt-1 block text-sm text-arena">{miembro.cargo || miembro.especialidad}</span>
        )}
        <span className="mt-3 inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] text-neutral-cream/80 group-hover:text-cream">
          Ver perfil
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </span>
    </Link>
  );
}
