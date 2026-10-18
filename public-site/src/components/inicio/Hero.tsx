'use client';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import MagneticButton from '../MagneticButton';
import ReservaRapida from './ReservaRapida';

const easeSalida = [0.22, 1, 0.36, 1] as const;

function Linea({ children, retraso, className = '' }: { children: React.ReactNode; retraso: number; className?: string }) {
  const reducir = useReducedMotion();
  return (
    <span aria-hidden="true" className={`block overflow-hidden pb-[0.08em] ${className}`}>
      <motion.span
        className="block"
        initial={reducir ? undefined : { y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay: retraso, ease: easeSalida }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// Portada editorial: la frase de la doctora en letras grandes, su foto en arco
// (como el isotipo del logo) y la reserva rápida debajo.
export default function Hero({ onReservar }: { onReservar: (nombreServicio?: string) => void }) {
  const reducir = useReducedMotion();
  const aparece = (retraso: number) => ({
    initial: reducir ? undefined : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: retraso, ease: easeSalida },
  });
  const titulo = 'font-serif font-light leading-[0.86] tracking-[-0.01em] text-espresso text-[clamp(56px,11.5vw,176px)]';

  return (
    <section id="inicio" className="relative overflow-hidden px-4 pb-10 pt-28 sm:px-8 md:pt-32">
      <div className="aura -right-52 -top-56 h-[640px] w-[640px] bg-[#D9C5B0] opacity-55" />
      <div className="aura -left-56 top-96 h-[520px] w-[520px] bg-neutral-cream opacity-90 [animation-delay:-7s]" />
      <div className="grano" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <h1 className="sr-only">Tu salud es nuestra prioridad — Clinic NovagED, medicina estética en Cochabamba</h1>
        <p className={titulo}>
          <Linea retraso={0.1}>Tu salud es</Linea>
          <Linea retraso={0.22} className="lg:hidden">
            nuestra <em className="font-light italic">prioridad</em>
          </Linea>
        </p>

        <div className="mt-8 grid items-center gap-10 lg:my-5 lg:grid-cols-[1fr_380px_1fr] lg:gap-10">
          <motion.div {...aparece(0.5)} className="order-2 flex max-w-md flex-col gap-6 lg:order-1">
            <p className="text-xs uppercase tracking-[0.22em] text-tan">Medicina estética con criterio médico</p>
            <p className="text-lg leading-relaxed text-ink">
              Rostro, cuerpo y salud de la mujer en un solo lugar. Cada tratamiento empieza con una evaluación médica y termina con un seguimiento en fotos.
            </p>
            <div className="flex flex-wrap gap-3">
              <MagneticButton>
                <button type="button" onClick={() => onReservar()} className="min-h-12 rounded-full bg-espresso px-7 text-[15px] text-cream transition-colors hover:bg-espresso-900">
                  Reservar mi evaluación
                </button>
              </MagneticButton>
              <a href="#especialidades" className="inline-flex min-h-12 items-center rounded-full border border-espresso px-7 text-[15px] text-espresso transition-colors hover:bg-espresso hover:text-cream">
                Ver tratamientos
              </a>
            </div>
          </motion.div>

          <motion.div
            className="arco relative order-1 mx-auto aspect-[3/4.2] w-full max-w-[380px] bg-neutral-cream shadow-[0_60px_90px_-60px_rgba(45,36,30,0.8)] lg:order-2"
            initial={reducir ? undefined : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.2, ease: easeSalida }}
          >
            <Image
              src="/novaged-assets/DraNovaged-CZHbEtUk.jpeg"
              alt="Dra. Maria Noemi Ponce Caisiri en Clinic NovagED"
              fill
              priority
              sizes="(min-width: 1024px) 380px, 90vw"
              className="object-cover object-top"
            />
          </motion.div>

          <motion.div {...aparece(0.7)} className="order-3 flex flex-col gap-3 sm:flex-row lg:max-w-[300px] lg:flex-col lg:justify-self-end">
            <div className="vidrio flex-1 rounded-3xl px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-tan">Dirección médica</p>
              <p className="mt-1 font-serif text-2xl leading-tight text-espresso">Dra. Maria Noemi Ponce Caisiri</p>
              <p className="mt-1.5 text-sm text-tan">Médico cirujano-ultrasonografista · Médico estético</p>
            </div>
            <div className="vidrio flex flex-1 items-center gap-3.5 rounded-3xl px-5 py-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 text-espresso" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
              <p className="text-sm leading-snug">Matriculada en SEDES y miembro del Colegio Médico de Cochabamba</p>
            </div>
          </motion.div>
        </div>

        <p className={`${titulo} hidden text-right lg:block`}>
          <Linea retraso={0.3}>
            nuestra <em className="font-light italic">prioridad</em>
          </Linea>
        </p>

        <motion.div {...aparece(0.9)} className="mt-12 md:mt-14">
          <ReservaRapida onReservar={onReservar} />
        </motion.div>
      </div>
    </section>
  );
}
