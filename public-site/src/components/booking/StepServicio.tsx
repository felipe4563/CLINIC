'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { Servicio, mensajeError } from '@/lib/types';
import { CARTA, CONSULTA } from '@/lib/cartaInicio';
import { normalizarNombre } from '@/lib/servicios';
import { TRATAMIENTOS } from '@/lib/tratamientos';

// Especialidad de cada servicio: la que tiene guardada; si no, la de la carta de la
// portada; lo que no está en ninguna va a "Otros".
const ESPECIALIDAD_DE = new Map<string, string>();
const DESCRIPCION_DE = new Map<string, string>();
for (const e of CARTA)
  for (const s of e.secciones)
    for (const it of s.items) {
      ESPECIALIDAD_DE.set(normalizarNombre(it.nombreServicio), e.titulo);
    }
// El resumen de una frase de cada tratamiento (el mismo de su página).
for (const t of TRATAMIENTOS) DESCRIPCION_DE.set(normalizarNombre(t.nombre), t.resumen);
const OTROS = 'Otros';
const PARA_EMPEZAR = 'Para empezar';

function esConsulta(s: Servicio) {
  return normalizarNombre(s.nombre) === normalizarNombre(CONSULTA);
}

function especialidad(s: Servicio) {
  if (s.especialidad) return s.especialidad;
  if (esConsulta(s)) return CARTA[0]?.titulo ?? OTROS; // la consulta es de medicina estética
  return ESPECIALIDAD_DE.get(normalizarNombre(s.nombre)) ?? OTROS;
}

// Servicios viejos tenían "Especialidad · Grupo — " al inicio de la descripción: eso ya se ve en la etiqueta.
function descripcion(s: Servicio) {
  if (esConsulta(s)) return 'La doctora te evalúa, revisa tu historia y te recomienda el tratamiento adecuado.';
  const corta = DESCRIPCION_DE.get(normalizarNombre(s.nombre));
  if (corta) return corta;
  const d = s.descripcion?.trim();
  if (!d) return null;
  const i = d.indexOf('—');
  return i >= 0 ? d.slice(i + 1).trim() : d;
}

export default function StepServicio() {
  const { servicioId, setServicioId, setServicio, setProfesionalId, setProfesional, setFecha, setHoraInicio, setStep } = useBooking();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    api
      .getServicios()
      .then((lista: Servicio[]) => {
        // La consulta de evaluación primero: es por donde conviene empezar.
        setServicios([...lista].sort((a, b) => Number(esConsulta(b)) - Number(esConsulta(a))));
      })
      .catch((e: unknown) => setError(mensajeError(e)))
      .finally(() => setLoading(false));
  }, []);

  const grupos = useMemo(() => {
    const orden = [...CARTA.map((e) => e.titulo), OTROS];
    const presentes = new Set(servicios.map(especialidad));
    return orden.filter((t) => presentes.has(t));
  }, [servicios]);

  const visibles = useMemo(() => {
    const buscado = normalizarNombre(q);
    return servicios.filter(
      (s) => (!filtro || especialidad(s) === filtro) && (!buscado || normalizarNombre(`${s.nombre} ${descripcion(s) ?? ''}`).includes(buscado)),
    );
  }, [servicios, q, filtro]);

  function elegir(s: Servicio) {
    if (s.id !== servicioId) {
      // Otro servicio cambia profesionales y horarios: se vuelven a elegir.
      setProfesionalId(null);
      setProfesional(null);
      setFecha('');
      setHoraInicio(null);
    }
    setServicioId(s.id);
    setServicio(s);
    setStep('paciente');
  }

  return (
    <div>
      <h2 className="font-serif text-[clamp(30px,3.4vw,42px)] font-light leading-tight text-espresso">Elige el servicio</h2>
      <p className="mt-1 text-[15px] text-tan">Si es tu primera vez, empieza con una consulta: la doctora te evalúa y te recomienda el tratamiento.</p>

      <label className="relative mt-6 block">
        <span className="sr-only">Buscar servicio</span>
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tan" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar servicio…"
          className="min-h-12 w-full rounded-full border border-manhattan bg-white pl-11 pr-5 text-[15px] text-ink placeholder:text-tan/70 focus:border-espresso focus:outline-none"
        />
      </label>

      {grupos.length > 1 && (
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {['', ...grupos].map((g) => (
            <button
              key={g || 'todos'}
              type="button"
              onClick={() => setFiltro(g)}
              aria-pressed={filtro === g}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                filtro === g ? 'border-espresso bg-espresso text-cream' : 'border-manhattan text-espresso hover:bg-neutral-cream'
              }`}
            >
              {g || 'Todos'}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      {loading && (
        <div className="mt-6 grid gap-3 md:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-neutral-cream" />
          ))}
        </div>
      )}

      {!loading && (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {visibles.map((s) => {
            const sel = s.id === servicioId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => elegir(s)}
                  aria-pressed={sel}
                  className={`group flex h-full w-full items-start justify-between gap-4 rounded-3xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-34px_rgba(45,36,30,0.7)] ${
                    sel ? 'border-espresso ring-1 ring-espresso' : 'border-manhattan/50 hover:border-manhattan'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-tan">{esConsulta(s) ? PARA_EMPEZAR : especialidad(s)}</span>
                    <span className="mt-1 block font-serif text-[22px] leading-snug text-espresso">{s.nombre}</span>
                    {descripcion(s) && <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-tan">{descripcion(s)}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-tan">Precio</span>
                    <span className="mt-1 block whitespace-nowrap font-serif text-2xl text-espresso">Bs {Number(s.precio).toLocaleString('es-BO')}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !error && visibles.length === 0 && (
        <p className="mt-6 rounded-3xl bg-neutral-cream p-6 text-[15px] text-tan">
          {servicios.length ? 'No encontramos ese servicio. Prueba con otra palabra.' : 'No hay servicios disponibles por el momento.'}
        </p>
      )}
    </div>
  );
}
