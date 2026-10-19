'use client';
import Link from 'next/link';
import { datosContacto, enlaceWhatsapp, useConfiguracion } from '@/lib/useDatosClinica';
import BotonReservar from './BotonReservar';

// Tarjeta lateral de la página de tratamiento: queda fija al bajar en pantallas grandes.
export default function TarjetaReserva({ nombre, contexto, hermanos }: { nombre: string; contexto: string; hermanos: { slug: string; nombre: string }[] }) {
  const c = datosContacto(useConfiguracion());
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-28">
      <div className="rounded-[28px] bg-espresso p-7 text-neutral-cream shadow-[0_40px_80px_-50px_rgba(45,36,30,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-manhattan">Reserva en línea</p>
        <p className="mt-2 font-serif text-3xl font-light leading-tight text-cream">{nombre}</p>
        <p className="mt-3 text-[15px] leading-relaxed">
          Elige día y hora, y asegura tu horario pagando con QR el 50 % o el total. Antes del tratamiento la doctora te evalúa y te explica todo.
        </p>
        <BotonReservar nombreServicio={nombre} className="mt-6 w-full bg-cream! text-espresso! hover:bg-white!" />
        {c.whatsapp && (
          <a
            href={enlaceWhatsapp(c.whatsapp, `Hola, quisiera información sobre ${nombre} en Clinic NovagED.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-manhattan text-[15px] text-cream transition-colors hover:bg-white/10"
          >
            Preguntar por WhatsApp
          </a>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-manhattan/30 pt-5 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-manhattan">Lun a vie</dt>
            <dd className="mt-0.5">09:00–13:00 · 14:00–20:00</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-manhattan">Sábado</dt>
            <dd className="mt-0.5">09:00–16:00</dd>
          </div>
        </dl>
      </div>

      {hermanos.length > 0 && (
        <div className="rounded-[28px] bg-white p-7">
          <p className="text-[11px] uppercase tracking-[0.2em] text-tan">También en {contexto}</p>
          <ul className="mt-3">
            {hermanos.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/tratamientos/${h.slug}`}
                  className="group flex items-center justify-between gap-3 border-b border-dotted border-tan/40 py-2.5 text-[15px] hover:text-espresso"
                >
                  <span className="group-hover:underline group-hover:decoration-manhattan group-hover:underline-offset-4">{h.nombre}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="shrink-0 text-tan transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
