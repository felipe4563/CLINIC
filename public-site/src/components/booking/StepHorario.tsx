'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { Profesional, mensajeError } from '@/lib/types';
import { aTexto, fechaLarga, hoyTexto, mayuscula } from './fechas';

type Slot = { hora_inicio: string; hora_fin: string };
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function mesDe(fecha: string) {
  return fecha.slice(0, 7);
}

function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split('-').map(Number);
  return aTexto(new Date(a, m - 1 + delta, 1)).slice(0, 7);
}

export default function StepHorario() {
  const { servicioId, profesionalId, profesional, setProfesionalId, setProfesional, fecha, setFecha, horaInicio, setHoraInicio } = useBooking();
  const hoy = hoyTexto();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [mes, setMes] = useState(mesDe(fecha || hoy));
  // Cada respuesta se guarda con la consulta que la pidió: si ya no coincide, se muestra cargando.
  const [diasLibres, setDiasLibres] = useState<{ clave: string; dias: Set<string> } | null>(null);
  const [horas, setHoras] = useState<{ clave: string; slots: Slot[] } | null>(null);
  const claveMes = `${profesionalId}|${servicioId}|${mes}`;
  const claveDia = `${profesionalId}|${servicioId}|${fecha}`;
  const libres = diasLibres?.clave === claveMes ? diasLibres.dias : null;
  const slots = fecha && horas?.clave === claveDia ? horas.slots : null;
  const [error, setError] = useState('');

  // Profesionales del servicio; si hay una sola, queda elegida.
  useEffect(() => {
    if (!servicioId) return;
    api
      .getProfesionales(servicioId)
      .then((lista: Profesional[]) => {
        setProfesionales(lista);
        if (lista.length && !lista.some((p) => p.id === profesionalId)) {
          setProfesionalId(lista[0].id);
          setProfesional(lista[0]);
        }
      })
      .catch((e: unknown) => setError(mensajeError(e)));
  }, [servicioId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Días con horarios libres del mes que se ve.
  useEffect(() => {
    if (!servicioId || !profesionalId) return;
    let vigente = true;
    const clave = claveMes;
    api
      .getDisponibilidadMes(profesionalId, servicioId, mes)
      .then((dias: { fecha: string }[]) => {
        if (!vigente) return;
        setDiasLibres({ clave, dias: new Set(dias.map((d) => d.fecha)) });
        // Primera vez: se abre en el primer día libre para ahorrar un clic.
        if (!fecha && dias.length) setFecha(dias[0].fecha);
      })
      .catch((e: unknown) => vigente && setError(mensajeError(e)));
    return () => {
      vigente = false;
    };
  }, [servicioId, profesionalId, mes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Horas libres del día elegido.
  useEffect(() => {
    if (!servicioId || !profesionalId || !fecha) return;
    let vigente = true;
    const clave = claveDia;
    api
      .getDisponibilidad(profesionalId, servicioId, fecha)
      .then((s: Slot[]) => vigente && setHoras({ clave, slots: s }))
      .catch((e: unknown) => vigente && setError(mensajeError(e)));
    return () => {
      vigente = false;
    };
  }, [servicioId, profesionalId, fecha, claveDia]);

  function elegirProfesional(p: Profesional) {
    if (p.id === profesionalId) return;
    setProfesionalId(p.id);
    setProfesional(p);
    setFecha('');
    setHoraInicio(null);
  }

  function elegirDia(d: string) {
    setFecha(d);
    setHoraInicio(null);
  }

  // Celdas del calendario, la semana empieza el lunes.
  const [a, m] = mes.split('-').map(Number);
  const primero = new Date(a, m - 1, 1);
  const huecos = (primero.getDay() + 6) % 7;
  const diasMes = new Date(a, m, 0).getDate();
  const celdas: (string | null)[] = [...Array(huecos).fill(null), ...Array.from({ length: diasMes }, (_, i) => aTexto(new Date(a, m - 1, i + 1)))];
  const nombreMes = mayuscula(primero.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }));
  const esMesActual = mes <= mesDe(hoy);

  const manana = slots?.filter((s) => s.hora_inicio < '12:00') ?? [];
  const tarde = slots?.filter((s) => s.hora_inicio >= '12:00') ?? [];

  return (
    <div>
      <h2 className="font-serif text-[clamp(30px,3.4vw,42px)] font-light leading-tight text-espresso">Elige fecha y hora</h2>
      <p className="mt-1 text-[15px] text-tan">Los días marcados tienen horarios libres.</p>
      {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
        {/* Calendario */}
        <div className="self-start rounded-3xl bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="font-serif text-2xl text-espresso">{nombreMes}</p>
            <div className="flex gap-2">
              <Flecha etiqueta="Mes anterior" disabled={esMesActual} onClick={() => setMes(moverMes(mes, -1))} d="M15 6l-6 6 6 6" />
              <Flecha etiqueta="Mes siguiente" onClick={() => setMes(moverMes(mes, 1))} d="M9 6l6 6-6 6" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
            {DIAS.map((d) => (
              <span key={d} className="pb-1 text-[11px] uppercase tracking-[0.14em] text-tan">{d}</span>
            ))}
            {celdas.map((d, i) => {
              if (!d) return <span key={`h${i}`} />;
              const libre = libres?.has(d) ?? false;
              const sel = d === fecha;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!libre}
                  onClick={() => elegirDia(d)}
                  aria-pressed={sel}
                  aria-label={`${fechaLarga(d)}${libre ? '' : ', sin horarios'}`}
                  className={`relative aspect-square rounded-2xl text-[15px] transition-colors sm:aspect-[1.25] ${
                    sel
                      ? 'bg-espresso text-cream'
                      : libre
                        ? 'bg-neutral-cream text-espresso hover:bg-manhattan/60'
                        : 'text-tan/35'
                  } ${d === hoy && !sel ? 'ring-1 ring-espresso/50' : ''} ${libres === null ? 'animate-pulse' : ''}`}
                >
                  {Number(d.slice(8))}
                </button>
              );
            })}
          </div>
          {libres && libres.size === 0 && (
            <p className="mt-4 text-center text-sm text-tan">No quedan horarios este mes. Mira el mes siguiente →</p>
          )}
        </div>

        {/* Profesional y horas */}
        <div className="flex flex-col gap-4">
          {profesionales.map((p) => {
            const sel = p.id === profesionalId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => elegirProfesional(p)}
                aria-pressed={sel}
                className={`flex items-center gap-4 rounded-3xl border bg-white p-4 text-left ${sel ? 'border-espresso' : 'border-transparent hover:border-manhattan'}`}
              >
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-cream font-serif text-xl text-espresso">
                  {p.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${API_URL}${p.foto_url}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    p.nombre.charAt(0)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-xl leading-tight text-espresso">{p.nombre}</span>
                  <span className="block text-sm text-tan">{p.especialidad || 'Profesional de la clínica'}</span>
                </span>
              </button>
            );
          })}

          <div className="rounded-3xl bg-white p-5">
            {!fecha ? (
              <p className="text-[15px] text-tan">Elige un día en el calendario para ver las horas.</p>
            ) : (
              <>
                <p className="font-serif text-xl text-espresso">{fechaLarga(fecha)}</p>
                {slots === null && (
                  <div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-11 animate-pulse rounded-full bg-neutral-cream" />)}
                  </div>
                )}
                {slots?.length === 0 && <p className="mt-3 text-sm text-tan">Ese día ya no tiene horas libres. Elige otro.</p>}
                {[['Mañana', manana], ['Tarde', tarde]].map(([titulo, lista]) =>
                  (lista as Slot[]).length ? (
                    <div key={titulo as string} className="mt-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-tan">{titulo as string}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(lista as Slot[]).map((s) => {
                          const sel = s.hora_inicio === horaInicio;
                          return (
                            <button
                              key={s.hora_inicio}
                              type="button"
                              onClick={() => setHoraInicio(s.hora_inicio)}
                              aria-pressed={sel}
                              className={`min-h-11 rounded-full border text-[15px] transition-colors ${
                                sel ? 'border-espresso bg-espresso text-cream' : 'border-manhattan text-espresso hover:border-espresso'
                              }`}
                            >
                              {s.hora_inicio}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null,
                )}
              </>
            )}
          </div>
          {profesional && horaInicio && fecha && (
            <p className="rounded-2xl bg-neutral-cream px-5 py-4 text-[15px] text-espresso">
              {fechaLarga(fecha)} a las <strong className="font-medium">{horaInicio}</strong>. Pulsa «Siguiente» para confirmar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Flecha({ etiqueta, d, onClick, disabled }: { etiqueta: string; d: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-manhattan text-espresso hover:bg-neutral-cream disabled:opacity-30"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </button>
  );
}
