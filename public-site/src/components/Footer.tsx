'use client';
import Link from 'next/link';
import { datosContacto, useConfiguracion } from '@/lib/useDatosClinica';

const ESPECIALIDADES = ['Medicina estética', 'Ginecología y obstetricia', 'Ecografía', 'Fisioterapia', 'Enfermería'];

export default function Footer() {
  const c = datosContacto(useConfiguracion());
  return (
    <footer className="rounded-t-[40px] bg-espresso-900 px-4 pb-8 pt-16 text-neutral-cream sm:px-8 md:rounded-t-[56px] md:pt-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="grid gap-10 text-[15px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <p className="font-serif text-3xl font-light leading-tight text-cream">
            Salud, belleza y <em className="italic text-manhattan">armonía</em>.
          </p>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-manhattan">Especialidades</p>
            <ul className="space-y-1.5">
              {ESPECIALIDADES.map((e) => (
                <li key={e}>
                  <Link href="/#especialidades" className="hover:text-cream hover:underline">{e}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-manhattan">Clínica</p>
            <ul className="space-y-1.5">
              <li><Link href="/#doctora" className="hover:text-cream hover:underline">La doctora</Link></li>
              <li><Link href="/#visita" className="hover:text-cream hover:underline">Tu primera visita</Link></li>
              <li><Link href="/#preguntas" className="hover:text-cream hover:underline">Preguntas frecuentes</Link></li>
              <li><Link href="/#contacto" className="hover:text-cream hover:underline">Cómo llegar</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-manhattan">Contacto</p>
            <ul className="space-y-1.5">
              <li><a href={`tel:${c.telefono.replace(/\s+/g, '')}`} className="hover:text-cream hover:underline">{c.telefono}</a></li>
              <li><a href={`mailto:${c.email}`} className="break-all hover:text-cream hover:underline">{c.email}</a></li>
              <li>{c.direccion}</li>
              <li>{c.ciudad}, {c.pais}</li>
            </ul>
          </div>
        </div>

        <p aria-hidden="true" className="font-serif text-[clamp(60px,13vw,210px)] font-light leading-[0.82] tracking-[-0.03em] text-cream">
          Clinic <em className="italic text-manhattan">NovagED</em>
        </p>

        <div className="flex flex-wrap justify-between gap-4 border-t border-manhattan/30 pt-6 text-xs text-manhattan">
          <span>© {new Date().getFullYear()} Clinic NovagED · Cochabamba, Bolivia</span>
          <span className="max-w-2xl">Fotos de tratamientos: Wikimedia Commons y Flickr, con su autor y licencia en la página de cada tratamiento.</span>
        </div>
      </div>
    </footer>
  );
}
