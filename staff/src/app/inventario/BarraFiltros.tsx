'use client';

import type { ReactNode } from 'react';

const campo = 'w-full min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground';

export function Buscador({ valor, onCambiar, placeholder }: { valor: string; onCambiar: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${campo} pl-8`}
      />
    </div>
  );
}

export function Selector({
  etiqueta,
  valor,
  onCambiar,
  opciones,
  todos,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (v: string) => void;
  opciones: { valor: string; texto: string }[];
  todos?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
      {etiqueta}
      <select value={valor} onChange={(e) => onCambiar(e.target.value)} className={campo}>
        {todos !== undefined && <option value="">{todos}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Chip({
  activo,
  onClick,
  children,
  tono = 'neutral',
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
  tono?: 'neutral' | 'rose' | 'amber';
}) {
  const inactivo = {
    neutral: 'border-border text-muted-foreground hover:bg-accent-soft hover:text-foreground',
    rose: 'border-stat-rose/40 text-stat-rose hover:bg-stat-rose-soft',
    amber: 'border-stat-amber/40 text-stat-amber hover:bg-stat-amber-soft',
  }[tono];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        activo ? 'border-accent bg-accent text-accent-foreground' : inactivo
      }`}
    >
      {children}
    </button>
  );
}

export function Resultado({
  mostrando,
  total,
  sustantivo,
  hayFiltros,
  onLimpiar,
}: {
  mostrando: number;
  total: number;
  sustantivo: string;
  hayFiltros: boolean;
  onLimpiar: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span aria-live="polite">
        Mostrando {mostrando} de {total} {sustantivo}
      </span>
      {hayFiltros && (
        <button type="button" onClick={onLimpiar} className="font-medium text-accent hover:underline">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

export function SinResultados({ onLimpiar }: { onLimpiar: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      Ningún resultado con estos filtros.{' '}
      <button type="button" onClick={onLimpiar} className="font-medium text-accent hover:underline">
        Limpiar filtros
      </button>
    </div>
  );
}

export const panelFiltros = 'mb-3 flex flex-col gap-2 rounded-xl border border-border bg-panel p-3';
