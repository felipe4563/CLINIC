'use client';
import { useState } from 'react';

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
    <div className="mt-6 rounded border border-tan/30 p-4">
      <label className="flex items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={aceptada}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-espresso"
        />
        <span>Acepto la política de inasistencia</span>
      </label>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="mt-2 text-xs uppercase tracking-widest text-tan hover:text-espresso"
      >
        {abierta ? 'Ocultar política' : 'Ver política completa'}
      </button>
      {abierta && (
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
          {texto.split(/\n{2,}/).map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      )}
    </div>
  );
}
