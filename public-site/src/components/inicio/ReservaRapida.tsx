'use client';
import { useId, useState } from 'react';
import { CARTA, CONSULTA } from '@/lib/cartaInicio';

// Barra de reserva de la portada: elige especialidad y tratamiento, y abre la
// reserva ya en el paso del profesional.
export default function ReservaRapida({ onReservar }: { onReservar: (nombreServicio?: string) => void }) {
  const id = useId();
  const [especialidad, setEspecialidad] = useState(0);
  const [servicio, setServicio] = useState(CONSULTA);

  const items = CARTA[especialidad].secciones.flatMap((s) => s.items);

  return (
    <form
      id="reservar"
      aria-label="Reserva rápida"
      onSubmit={(e) => {
        e.preventDefault();
        onReservar(servicio);
      }}
      className="vidrio grid gap-1 rounded-[28px] p-2 shadow-[0_40px_70px_-45px_rgba(45,36,30,0.6)] md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:rounded-full"
    >
      <div className="flex flex-col px-5 py-2 md:border-r md:border-manhattan/60 md:px-6">
        <label htmlFor={`${id}-esp`} className="text-[11px] uppercase tracking-[0.16em] text-tan">Especialidad</label>
        <select
          id={`${id}-esp`}
          value={especialidad}
          onChange={(e) => {
            setEspecialidad(Number(e.target.value));
            setServicio(Number(e.target.value) === 0 ? CONSULTA : CARTA[Number(e.target.value)].secciones[0].items[0].nombreServicio);
          }}
          className="min-h-10 w-full cursor-pointer bg-transparent text-base text-ink outline-none"
        >
          {CARTA.map((e, i) => (
            <option key={e.numero} value={i}>{e.titulo}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col border-t border-manhattan/40 px-5 py-2 md:border-r md:border-t-0 md:border-manhattan/60 md:px-6">
        <label htmlFor={`${id}-trat`} className="text-[11px] uppercase tracking-[0.16em] text-tan">Tratamiento</label>
        <select
          id={`${id}-trat`}
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className="min-h-10 w-full cursor-pointer bg-transparent text-base text-ink outline-none"
        >
          {especialidad === 0 && <option value={CONSULTA}>Consulta de evaluación</option>}
          {items.map((i) => (
            <option key={i.slug} value={i.nombreServicio}>{i.nombre}</option>
          ))}
        </select>
      </div>
      <div className="hidden flex-col px-6 py-2 md:flex">
        <span className="text-[11px] uppercase tracking-[0.16em] text-tan">Pago</span>
        <span className="min-h-10 py-2 text-base text-ink">Con QR · 50 % o total</span>
      </div>
      <button
        type="submit"
        className="mt-1 inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-espresso px-8 text-[15px] text-cream transition-colors hover:bg-espresso-900 md:mt-0"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
        Ver horarios libres
      </button>
    </form>
  );
}
