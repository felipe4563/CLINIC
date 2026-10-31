'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { nombreCorto, parrafos, separarNombre } from '@/lib/equipo';
import { buscarServicioPorNombre } from '@/lib/servicios';
import { fotoSrc, useEquipo } from '@/lib/useEquipo';
import type { MiembroEquipo } from '@/lib/types';
import { FotoArco } from '@/components/inicio/Equipo';

type Estado = { slug: string; miembro: MiembroEquipo | null } | null;

function Flecha() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="shrink-0 text-tan transition-transform group-hover:translate-x-1">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function PerfilProfesional({ slug, tratamientos }: { slug: string; tratamientos: { nombre: string; slug: string }[] }) {
  const { open } = useBooking();
  const equipo = useEquipo();
  // La respuesta se guarda con el slug que la pidió: si no coincide, se muestra cargando.
  const [estado, setEstado] = useState<Estado>(null);

  useEffect(() => {
    let vigente = true;
    api
      .getMiembroEquipo(slug)
      .then((m: MiembroEquipo) => vigente && setEstado({ slug, miembro: m }))
      .catch(() => vigente && setEstado({ slug, miembro: null }));
    return () => {
      vigente = false;
    };
  }, [slug]);

  // undefined = cargando; null = no existe o no está publicado.
  const m = estado?.slug === slug ? estado.miembro : undefined;
  const nombre = m?.nombre;

  useEffect(() => {
    if (m === undefined) return;
    document.title = `${nombre ?? 'Perfil no encontrado'} — Clinic NovagED`;
  }, [m, nombre]);

  if (m === undefined) {
    return (
      <div className="px-4 pb-24 pt-28 sm:px-8 xl:px-12" aria-busy="true">
        <div className="mx-auto grid max-w-sitio gap-8 rounded-[44px] bg-neutral-cream p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-12">
          <div className="arco aspect-[4/5] w-full max-w-[420px] animate-pulse bg-cream" />
          <div className="flex flex-col gap-4 lg:py-10">
            <span className="h-4 w-40 animate-pulse rounded-full bg-cream" />
            <span className="h-20 w-full max-w-lg animate-pulse rounded-3xl bg-cream" />
            <span className="h-4 w-64 animate-pulse rounded-full bg-cream" />
          </div>
        </div>
      </div>
    );
  }

  if (!m) {
    return (
      <div className="px-4 pb-24 pt-36 text-center sm:px-8">
        <h1 className="font-serif text-[clamp(40px,5vw,72px)] font-light text-espresso">No encontramos este perfil</h1>
        <p className="mt-4 text-lg">Puede que ya no esté publicado.</p>
        <Link href="/#equipo" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-espresso px-7 text-[15px] text-cream hover:bg-espresso-900">
          Ver el equipo
        </Link>
      </div>
    );
  }

  const [inicio, final] = separarNombre(m.nombre);
  const cargo = m.cargo || m.especialidad;
  const corto = nombreCorto(m.nombre);
  const atiende = m.Servicios.map((s) => ({ ...s, tratamiento: buscarServicioPorNombre(tratamientos, s.nombre) })).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es'),
  );
  const otros = (equipo ?? []).filter((x) => x.slug !== m.slug);
  const reservar = () => open(undefined, m.id);

  return (
    <article className="px-4 pb-24 pt-24 sm:px-8 md:pt-28 xl:px-12">
      <div className="mx-auto max-w-sitio">
        {/* Portada */}
        <header className="relative grid items-center gap-10 overflow-hidden rounded-[32px] bg-neutral-cream p-5 sm:p-8 md:rounded-[44px] lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:p-12">
          <div className="grano" />
          <FotoArco src={fotoSrc(m.foto_url)} alt={`${m.nombre}, Clinic NovagED`} className="relative mx-auto aspect-[4/5] w-full max-w-[440px] shadow-[0_60px_90px_-60px_rgba(45,36,30,0.8)]" />
          <div className="relative flex flex-col gap-6">
            <nav aria-label="Ubicación en el sitio" className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-tan">
              <Link href="/#equipo" className="hover:text-espresso">Nuestro equipo</Link>
              <span aria-hidden="true">/</span>
              <span>{m.nombre}</span>
            </nav>
            <h1 className="break-words font-serif text-[clamp(44px,6vw,104px)] font-light leading-[0.92] text-espresso">
              {inicio} {final && <em className="italic text-tan">{final}</em>}
            </h1>
            {cargo && <p className="text-[13px] uppercase tracking-[0.18em] text-tan">{cargo}</p>}
            {(m.especialidad && m.especialidad !== cargo) || m.registro_profesional ? (
              <ul className="flex flex-wrap gap-2 text-sm">
                {m.especialidad && m.especialidad !== cargo && <li className="vidrio rounded-full px-4 py-2 text-espresso">{m.especialidad}</li>}
                {m.registro_profesional && <li className="vidrio rounded-full px-4 py-2 text-espresso">Registro profesional {m.registro_profesional}</li>}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={reservar} className="min-h-12 rounded-full bg-espresso px-7 text-[15px] text-cream transition-colors hover:bg-espresso-900">
                Reservar con {corto}
              </button>
              {atiende.length > 0 && (
                <a href="#atiende" className="inline-flex min-h-12 items-center rounded-full border border-espresso px-7 text-[15px] text-espresso transition-colors hover:bg-espresso hover:text-cream">
                  Qué atiende
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Biografía y formación */}
        <div className={`mt-6 grid gap-6 ${m.formacion.length ? 'lg:grid-cols-[1.3fr_0.7fr]' : ''}`}>
          <section className="rounded-[28px] bg-white p-7 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-tan">Biografía</p>
            <h2 className="mt-2 font-serif text-[clamp(30px,3vw,44px)] font-light leading-tight text-espresso">Sobre {corto}</h2>
            <div className="mt-5 flex max-w-3xl flex-col gap-4 text-[16.5px] leading-relaxed">
              {parrafos(m.biografia).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
          {m.formacion.length > 0 && (
            <section className="rounded-[28px] bg-espresso p-7 text-neutral-cream sm:p-10">
              <p className="text-[11px] uppercase tracking-[0.2em] text-arena">Trayectoria</p>
              <h2 className="mt-2 font-serif text-[clamp(30px,3vw,44px)] font-light leading-tight text-cream">Formación y credenciales</h2>
              <ul className="mt-6 flex flex-col divide-y divide-manhattan/25">
                {m.formacion.map((f, i) => (
                  <li key={`${f.titulo}-${i}`} className="py-4 first:pt-0 last:pb-0">
                    {f.titulo && <p className="font-serif text-2xl text-cream">{f.titulo}</p>}
                    {f.detalle && <p className="mt-0.5 text-sm text-arena">{f.detalle}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Lo que atiende */}
        {atiende.length > 0 && (
          <section id="atiende" className="mt-6 scroll-mt-28 rounded-[28px] bg-neutral-cream p-7 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-tan">Servicios</p>
            <h2 className="mt-2 font-serif text-[clamp(30px,3vw,44px)] font-light leading-tight text-espresso">Qué atiende</h2>
            <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
              {atiende.map((s) => (
                <li key={s.id}>
                  {s.tratamiento ? (
                    <Link
                      href={`/tratamientos/${s.tratamiento.slug}`}
                      className="group flex min-h-12 items-center justify-between gap-3 border-b border-dotted border-tan/50 py-2.5 text-[15.5px] hover:text-espresso"
                    >
                      <span className="group-hover:underline group-hover:decoration-manhattan group-hover:underline-offset-4">{s.nombre}</span>
                      <Flecha />
                    </Link>
                  ) : (
                    <span className="flex min-h-12 items-center border-b border-dotted border-tan/50 py-2.5 text-[15.5px]">{s.nombre}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Resto del equipo */}
        {otros.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-[clamp(30px,3vw,44px)] font-light leading-tight text-espresso">También en el equipo</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {otros.map((o) => (
                <li key={o.id}>
                  <Link href={`/equipo/${o.slug}`} className="group flex items-center gap-4 rounded-[28px] bg-white p-4 transition-shadow hover:shadow-[0_30px_60px_-40px_rgba(45,36,30,0.6)]">
                    <FotoArco src={fotoSrc(o.foto_url)} alt="" className="h-20 w-16 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-xl leading-tight text-espresso">{o.nombre}</span>
                      {(o.cargo || o.especialidad) && <span className="mt-1 block text-sm text-tan">{o.cargo || o.especialidad}</span>}
                    </span>
                    <Flecha />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
