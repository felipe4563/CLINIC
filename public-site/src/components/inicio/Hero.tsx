'use client';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import MagneticButton from '../MagneticButton';
import ReservaRapida from './ReservaRapida';

const easeSalida = [0.22, 1, 0.36, 1] as const;

function Linea({ children, retraso, className = '' }: { children: React.ReactNode; retraso: number; className?: string }) {
  const reducir = useReducedMotion();
  return (
    <span aria-hidden="true" className={`block overflow-hidden pb-[0.1em] ${className}`}>
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

// Portada en dos columnas: a la izquierda la frase, el texto y quién atiende;
// a la derecha la doctora en arco (como el isotipo del logo) con la sala de espera.
export default function Hero({ onReservar }: { onReservar: (nombreServicio?: string) => void }) {
  const reducir = useReducedMotion();
  const aparece = (retraso: number) => ({
    initial: reducir ? undefined : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: retraso, ease: easeSalida },
  });

  return (
    <section id="inicio" className="relative overflow-hidden px-4 pb-10 pt-28 sm:px-8 xl:px-12 md:pt-36">
      <div className="aura -right-52 -top-56 h-[640px] w-[640px] bg-[#D9C5B0] opacity-55" />
      <div className="aura -left-56 top-96 h-[520px] w-[520px] bg-neutral-cream opacity-90 [animation-delay:-7s]" />
      <div className="grano" />

      <div className="relative z-10 mx-auto max-w-sitio">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 2xl:gap-24">
          {/* Texto */}
          <div>
            <motion.p {...aparece(0.05)} className="flex items-center gap-4 text-xs uppercase tracking-[0.24em] text-tan">
              <span className="h-px w-10 bg-tan/60" aria-hidden="true" />
              Medicina estética con criterio médico
            </motion.p>

            <h1 className="sr-only">Tu salud es nuestra prioridad — Clinic NovagED, medicina estética en Cochabamba</h1>
            <p className="mt-6 font-serif text-[clamp(54px,7.4vw,138px)] font-light leading-[0.9] tracking-[-0.015em] text-espresso">
              <Linea retraso={0.1}>Tu salud es</Linea>
              <Linea retraso={0.22}>
                nuestra <em className="font-light italic text-tan">prioridad</em>
              </Linea>
            </p>

            <motion.p {...aparece(0.45)} className="mt-8 max-w-xl text-lg leading-relaxed text-ink md:text-xl">
              Rostro, cuerpo y salud de la mujer en un solo lugar. Cada tratamiento empieza con una evaluación médica y termina con un seguimiento en fotos.
            </motion.p>

            <motion.div {...aparece(0.55)} className="mt-9 flex flex-wrap gap-3">
              <MagneticButton>
                <button type="button" onClick={() => onReservar()} className="min-h-13 rounded-full bg-espresso px-8 py-3.5 text-[15px] text-cream transition-colors hover:bg-espresso-900">
                  Reservar mi evaluación
                </button>
              </MagneticButton>
              <a href="#especialidades" className="inline-flex min-h-13 items-center rounded-full border border-espresso px-8 py-3.5 text-[15px] text-espresso transition-colors hover:bg-espresso hover:text-cream">
                Ver tratamientos
              </a>
            </motion.div>

            {/* Quién atiende */}
            <motion.div {...aparece(0.7)} className="mt-12 grid gap-5 border-t border-manhattan/70 pt-7 sm:grid-cols-2 sm:gap-8">
              <div className="flex items-center gap-4">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-cream ring-2 ring-white">
                  <Image src="/novaged-assets/DraNovaged-CZHbEtUk.jpeg" alt="" fill sizes="56px" className="object-cover object-top" />
                </span>
                <span>
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-tan">Dirección médica</span>
                  <span className="mt-0.5 block font-serif text-xl leading-tight text-espresso">Dra. Maria Noemi Ponce Caisiri</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-manhattan text-espresso">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                    <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                <span className="text-[15px] leading-snug text-ink">Matriculada en SEDES y miembro del Colegio Médico de Cochabamba</span>
              </div>
            </motion.div>
          </div>

          {/* Fotos */}
          <div className="relative mx-auto w-full max-w-[480px] pb-16 pl-10 sm:max-w-[560px] sm:pb-20 sm:pl-16 lg:max-w-[560px] lg:justify-self-end 2xl:max-w-[600px]">
            <motion.div
              className="arco relative ml-auto aspect-[3/4] w-full max-w-[470px] bg-neutral-cream shadow-[0_60px_90px_-60px_rgba(45,36,30,0.8)] 2xl:max-w-[520px]"
              initial={reducir ? undefined : { opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, delay: 0.15, ease: easeSalida }}
            >
              <Image
                src="/novaged-assets/DraNovaged-CZHbEtUk.jpeg"
                alt="Dra. Maria Noemi Ponce Caisiri en Clinic NovagED"
                fill
                priority
                sizes="(min-width: 1536px) 520px, (min-width: 1024px) 470px, 85vw"
                className="object-cover object-top"
              />
            </motion.div>

            <motion.div
              className="absolute bottom-0 left-0 w-[52%] max-w-[300px] overflow-hidden rounded-[28px] border-[6px] border-cream bg-neutral-cream shadow-[0_40px_70px_-40px_rgba(45,36,30,0.85)] sm:border-8"
              initial={reducir ? undefined : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.55, ease: easeSalida }}
            >
              <div className="relative aspect-[4/3.2]">
                <Image src="/novaged-assets/espacioNovaged1-QkEOIec4.png" alt="Sala de espera de Clinic NovagED" fill sizes="300px" className="object-cover" />
              </div>
            </motion.div>

            <motion.div
              {...aparece(0.8)}
              className="vidrio absolute left-0 top-[22%] hidden items-center gap-3 rounded-full py-2 pl-2 pr-5 sm:flex"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream">
                <Image src="/novaged-assets/isotipo-chocolate.png" alt="" width={26} height={26} />
              </span>
              <span className="text-sm leading-tight text-espresso">
                Cochabamba
                <span className="block text-xs text-tan">Medicina estética</span>
              </span>
            </motion.div>
          </div>
        </div>

        <motion.div {...aparece(0.9)} className="mt-16 md:mt-20">
          <ReservaRapida onReservar={onReservar} />
        </motion.div>
      </div>
    </section>
  );
}
