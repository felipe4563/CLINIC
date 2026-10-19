'use client';
import Image from 'next/image';
import Link from 'next/link';
import { datosContacto, enlaceWhatsapp, useConfiguracion } from '@/lib/useDatosClinica';
import BotonReservar from './BotonReservar';

// Columna lateral de la página de tratamiento: reserva y quién atiende.
// Es corta a propósito para que entre en pantalla y acompañe al bajar.
export default function TarjetaReserva({ nombre }: { nombre: string }) {
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

      <Link href="/#doctora" className="group flex items-center gap-4 rounded-[28px] bg-white p-5 transition-shadow hover:shadow-[0_30px_60px_-40px_rgba(45,36,30,0.6)]">
        <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-t-full rounded-b-xl bg-neutral-cream">
          <Image src="/novaged-assets/DraNovaged-CZHbEtUk.jpeg" alt="" fill sizes="64px" className="object-cover object-top" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-tan">Te atiende</span>
          <span className="mt-1 block font-serif text-xl leading-tight text-espresso">Dra. Maria Noemi Ponce Caisiri</span>
          <span className="mt-1 block text-sm text-tan">Médico estético · Matriculada en SEDES</span>
        </span>
      </Link>
    </div>
  );
}
