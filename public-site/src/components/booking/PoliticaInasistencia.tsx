'use client';
import { useState } from 'react';

// El "reglamento" de la reserva: la política de inasistencia de la Configuración.
export default function PoliticaInasistencia({
  texto,
  aceptada,
  onChange,
}: {
  texto: string;
  aceptada: boolean;
  onChange: (v: boolean) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between py-4 text-left font-serif text-xl text-espresso"
      >
        Política de inasistencia
        <span aria-hidden="true" className={`text-3xl font-light leading-none text-tan transition-transform ${abierta ? 'rotate-45' : ''}`}>+</span>
      </button>
      {abierta && (
        <div className="barra-fina max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-cream/60 p-4 text-sm leading-relaxed text-ink">
          {texto.split(/\n{2,}/).map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-manhattan/60 px-4 py-3.5 text-[15px] text-espresso">
        <input type="checkbox" checked={aceptada} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-espresso" />
        <span>Leí y acepto la política de inasistencia</span>
      </label>
    </div>
  );
}
