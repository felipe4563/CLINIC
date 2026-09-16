'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import MagneticButton from './MagneticButton';

const easeSalida = [0.22, 1, 0.36, 1] as const;

export default function Hero({ onReservar }: { onReservar: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducirMovimiento = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yFondo = useTransform(scrollYProgress, [0, 1], reducirMovimiento ? [0, 0] : [0, 160]);

  return (
    <section id="top" ref={ref} className="relative min-h-screen flex items-end bg-espresso text-cream overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ y: yFondo }}
        initial={reducirMovimiento ? undefined : { scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.2, ease: easeSalida }}
      >
        <Image
          src="/novaged-assets/fondoImagen-C2baLwir.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/[0.58]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 pb-20 pt-40">
        <h1 className="font-serif text-5xl md:text-[69px] xl:text-[130px] leading-[0.88] tracking-[-0.03em]">
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              initial={reducirMovimiento ? undefined : { y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: easeSalida }}
            >
              Esculpir la
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.em
              className="block italic"
              initial={reducirMovimiento ? undefined : { y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: easeSalida }}
            >
              Esencia
            </motion.em>
          </span>
        </h1>
        <motion.p
          className="mt-8 max-w-md text-cream/80"
          initial={reducirMovimiento ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: easeSalida }}
        >
          Arquitectura facial y medicina estética avanzada diseñada para revelar
          la belleza intrínseca que reside en el equilibrio.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap gap-4"
          initial={reducirMovimiento ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: easeSalida }}
        >
          <MagneticButton>
            <button
              onClick={onReservar}
              className="rounded-full bg-cream text-espresso text-xs tracking-widest uppercase px-8 py-4 hover:opacity-85 transition-opacity"
            >
              Agenda tu consulta
            </button>
          </MagneticButton>
          <MagneticButton>
            <a
              href="#tratamientos"
              className="rounded-full border border-cream/40 text-cream text-xs tracking-widest uppercase px-8 py-4 hover:border-cream/80 transition-colors"
            >
              Conocer más
            </a>
          </MagneticButton>
        </motion.div>
        <motion.div
          className="mt-16 flex items-center gap-4 text-cream/70"
          initial={reducirMovimiento ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
        >
          <span className="h-px w-10 bg-cream/40" />
          <em className="italic font-serif">Boutique Medical Excellence</em>
        </motion.div>
        <a
          href="#nosotros"
          className="mt-4 inline-flex items-center gap-2 text-xs tracking-widest uppercase text-cream/70"
        >
          Descubre más
          <motion.span
            animate={reducirMovimiento ? undefined : { y: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.span>
        </a>
      </div>
    </section>
  );
}
