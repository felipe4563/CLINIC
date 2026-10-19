'use client';
import { datosContacto, enlaceWhatsapp, useConfiguracion } from '@/lib/useDatosClinica';
import MagneticButton from './MagneticButton';
import Reveal from './Reveal';

export default function Contacto({ onReservar }: { onReservar: () => void }) {
  const config = useConfiguracion();
  const c = datosContacto(config);
  const mapa = encodeURIComponent(c.completa);

  return (
    <section id="contacto" className="px-4 pb-24 sm:px-8 xl:px-12 md:pb-32">
      <Reveal className="relative mx-auto max-w-sitio overflow-hidden rounded-[32px] bg-espresso px-6 py-14 text-neutral-cream sm:px-12 md:rounded-[48px] md:py-20 lg:px-16">
        <div className="aura -bottom-64 -right-32 h-[520px] w-[520px] bg-tan opacity-70" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-7">
            <h2 className="font-serif text-[clamp(52px,7vw,112px)] font-light leading-[0.88] text-cream">
              Te <em className="italic text-manhattan">esperamos</em>
            </h2>
            <p className="max-w-md">{c.completa}</p>
            <dl className="grid gap-5 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-manhattan">WhatsApp y teléfono</dt>
                <dd className="mt-1">
                  <a href={`tel:${c.telefono.replace(/\s+/g, '')}`} className="hover:text-cream hover:underline">{c.telefono}</a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-manhattan">Correo</dt>
                <dd className="mt-1">
                  <a href={`mailto:${c.email}`} className="break-all hover:text-cream hover:underline">{c.email}</a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-manhattan">Lunes a viernes</dt>
                <dd className="mt-1">09:00–13:00 · 14:00–20:00</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-manhattan">Sábado</dt>
                <dd className="mt-1">09:00–16:00</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <MagneticButton>
                <button type="button" onClick={onReservar} className="min-h-12 rounded-full bg-cream px-7 text-[15px] text-espresso transition-colors hover:bg-white">
                  Reservar cita
                </button>
              </MagneticButton>
              {c.whatsapp && (
                <a
                  href={enlaceWhatsapp(c.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full border border-manhattan px-7 text-[15px] text-cream transition-colors hover:bg-white/10"
                >
                  Escribir por WhatsApp
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-t-full rounded-b-[28px] border border-manhattan/40 bg-espresso-900">
              <iframe
                title="Ubicación de Clinic NovagED en Google Maps"
                src={`https://www.google.com/maps?q=${mapa}&output=embed`}
                className="absolute inset-0 h-full w-full border-0 grayscale-[85%] sepia-[18%] contrast-[1.05]"
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm text-manhattan hover:text-cream"
            >
              Cómo llegar con Google Maps
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
