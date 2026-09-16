'use client';

import { useRef, ReactElement, cloneElement, PointerEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const RADIO_MAXIMO = 60;
const FUERZA = 0.35;

/**
 * Envuelve un boton/enlace y lo hace seguir levemente al cursor cuando esta
 * cerca. Se desactiva en touch (no hay "cerca del cursor" en movil) y en
 * prefers-reduced-motion.
 */
export default function MagneticButton({ children }: { children: ReactElement }) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.3 });

  function alMoverPuntero(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    const centroX = rect.left + rect.width / 2;
    const centroY = rect.top + rect.height / 2;
    const dx = e.clientX - centroX;
    const dy = e.clientY - centroY;
    const distancia = Math.hypot(dx, dy);

    if (distancia < Math.max(rect.width, rect.height) / 2 + RADIO_MAXIMO) {
      x.set(dx * FUERZA);
      y.set(dy * FUERZA);
    }
  }

  function alSalirPuntero() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      className="inline-block"
      style={{ x: springX, y: springY }}
      onPointerMove={alMoverPuntero}
      onPointerLeave={alSalirPuntero}
    >
      {cloneElement(children, { ref } as never)}
    </motion.span>
  );
}
