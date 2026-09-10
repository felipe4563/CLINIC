'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Estado = 'pendiente_pago' | 'confirmada' | 'cancelada';
type CitaResumen = { id: number; fecha: string; estado: Estado };

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DOT_COLOR: Record<Estado, string> = {
  confirmada: 'var(--stat-green)',
  pendiente_pago: 'var(--stat-amber)',
  cancelada: 'var(--muted-foreground)',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function hoyISO() {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function MonthCalendar({
  fecha,
  profesionalId,
  onSelectDay,
}: {
  fecha: string;
  profesionalId: string;
  onSelectDay: (fecha: string) => void;
}) {
  const inicial = new Date(`${fecha}T00:00:00`);
  const [viewYear, setViewYear] = useState(inicial.getFullYear());
  const [viewMonth, setViewMonth] = useState(inicial.getMonth());
  const [citas, setCitas] = useState<CitaResumen[]>([]);

  useEffect(() => {
    const desde = iso(viewYear, viewMonth, 1);
    const hasta = iso(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());
    api
      .getCitasRango(desde, hasta, profesionalId || undefined)
      .then(setCitas)
      .catch(() => setCitas([]));
  }, [viewYear, viewMonth, profesionalId]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, CitaResumen[]>();
    for (const c of citas) {
      const lista = mapa.get(c.fecha) || [];
      lista.push(c);
      mapa.set(c.fecha, lista);
    }
    return mapa;
  }, [citas]);

  const celdas = useMemo(() => {
    const primerDia = new Date(viewYear, viewMonth, 1);
    const offsetLunes = (primerDia.getDay() + 6) % 7; // 0=lunes
    const diasEnMes = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalCeldas = Math.ceil((offsetLunes + diasEnMes) / 7) * 7;

    return Array.from({ length: totalCeldas }, (_, i) => {
      const numeroDia = i - offsetLunes + 1;
      const enMes = numeroDia >= 1 && numeroDia <= diasEnMes;
      if (!enMes) return null;
      return { dia: numeroDia, fecha: iso(viewYear, viewMonth, numeroDia) };
    });
  }, [viewYear, viewMonth]);

  function cambiarMes(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize">
          {MESES[viewMonth]} {viewYear}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => cambiarMes(-1)} className="rounded p-1.5 hover:bg-accent-soft" aria-label="Mes anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
              onSelectDay(hoyISO());
            }}
            className="rounded px-2 py-1 text-xs font-medium hover:bg-accent-soft"
          >
            Hoy
          </button>
          <button onClick={() => cambiarMes(1)} className="rounded p-1.5 hover:bg-accent-soft" aria-label="Mes siguiente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {DIAS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((celda, i) => {
          if (!celda) return <div key={i} />;
          const citasDelDia = porDia.get(celda.fecha) || [];
          const esHoy = celda.fecha === hoyISO();
          const esSeleccionado = celda.fecha === fecha;
          const dots = citasDelDia.slice(0, 3);
          const extra = citasDelDia.length - dots.length;

          return (
            <button
              key={celda.fecha}
              onClick={() => onSelectDay(celda.fecha)}
              className={`flex h-16 flex-col items-center justify-start gap-1 rounded-lg border p-1.5 text-xs transition-colors ${
                esSeleccionado
                  ? 'border-accent bg-accent-soft'
                  : citasDelDia.length > 0
                    ? 'border-border bg-background hover:bg-accent-soft/60'
                    : 'border-transparent hover:bg-accent-soft/60'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  esHoy ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {celda.dia}
              </span>
              {citasDelDia.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {dots.map((c) => (
                    <span key={c.id} className="h-1.5 w-1.5 rounded-full" style={{ background: DOT_COLOR[c.estado] }} />
                  ))}
                  {extra > 0 && <span className="text-[9px] text-muted-foreground">+{extra}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
