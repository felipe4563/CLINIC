'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

// Mantenimiento de muebles y equipos del inventario por lugar: se manda una
// cantidad con su fecha de salida y, al recogerlo, se anota la fecha de regreso
// y el costo (que sale de caja). Los insumos no van a mantenimiento.

type ItemRef = { id: number; nombre: string; tipo: string; cantidad: number | null; InventarioLugar: { id: number; nombre: string } };
type Equipo = ItemRef & { disponibles: number };
type Registro = {
  id: number;
  cantidad: number;
  fecha_salida: string;
  motivo: string | null;
  destino: string | null;
  fecha_regreso: string | null;
  trabajo_realizado: string | null;
  costo: string | null;
  InventarioItem: ItemRef;
  UsuarioSalida: { nombre: string } | null;
  UsuarioRegreso: { nombre: string } | null;
};

const input = 'rounded border border-border bg-panel px-2 py-1.5 text-sm';

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmt(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

function dias(desde: string, hasta: string) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000);
}

function textoDias(n: number) {
  if (n <= 0) return 'el mismo día';
  return n === 1 ? '1 día' : `${n} días`;
}

const nombreConCantidad = (r: Registro) => `${r.InventarioItem.nombre}${r.cantidad > 1 ? ` × ${r.cantidad}` : ''}`;

export default function MantenimientoEquipos() {
  const [enCurso, setEnCurso] = useState<Registro[]>([]);
  const [historial, setHistorial] = useState<Registro[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mandando, setMandando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(
    () =>
      Promise.all([api.getMantenimientos(), api.getEquiposMantenimiento()])
        .then(([m, e]: [{ enCurso: Registro[]; historial: Registro[] }, Equipo[]]) => {
          setEnCurso(m.enCurso);
          setHistorial(m.historial);
          setEquipos(e);
          setError('');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el mantenimiento'))
        .finally(() => setCargando(false)),
    [],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function accion(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await cargar();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
      return false;
    }
  }

  const hoy = hoyISO();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Muebles y equipos de la clínica que salen a arreglar y vuelven al inventario.</p>
        {!mandando && (
          <button
            type="button"
            onClick={() => setMandando(true)}
            disabled={!equipos.length}
            title={!equipos.length && !cargando ? 'No hay muebles ni equipos en el inventario para mandar' : undefined}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            Mandar a mantenimiento
          </button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {mandando && <FormSalida equipos={equipos} hoy={hoy} onCerrar={() => setMandando(false)} accion={accion} />}

      <section className="rounded-lg border border-border bg-panel p-4">
        <h2 className="mb-3 text-base font-semibold">
          En mantenimiento <span className="text-sm font-normal text-muted-foreground">({enCurso.length})</span>
        </h2>
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : enCurso.length ? (
          <div className="flex flex-col gap-2">
            {enCurso.map((r) => (
              <Afuera key={r.id} registro={r} hoy={hoy} accion={accion} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay nada afuera ahora.</p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-panel p-4">
        <h2 className="mb-3 text-base font-semibold">Historial</h2>
        {historial.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Equipo</th>
                  <th className="py-1 pr-2 font-medium">Salió</th>
                  <th className="py-1 pr-2 font-medium">Volvió</th>
                  <th className="py-1 pr-2 font-medium">Tiempo</th>
                  <th className="py-1 pr-2 text-right font-medium">Costo</th>
                  <th className="py-1 font-medium">Qué se hizo</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="py-1.5 pr-2">
                      {nombreConCantidad(r)}
                      <p className="text-xs text-muted-foreground">
                        {r.InventarioItem.InventarioLugar.nombre}
                        {r.destino ? ` · ${r.destino}` : ''}
                      </p>
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">{fmt(r.fecha_salida)}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{fmt(r.fecha_regreso!)}</td>
                    <td className="py-1.5 pr-2">{textoDias(dias(r.fecha_salida, r.fecha_regreso!))}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{Number(r.costo) > 0 ? `Bs ${Number(r.costo).toFixed(2)}` : '—'}</td>
                    <td className="py-1.5 text-xs text-muted-foreground">{r.trabajo_realizado || r.motivo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no volvió nada de mantenimiento.</p>
        )}
      </section>
    </div>
  );
}

function FormSalida({ equipos, hoy, onCerrar, accion }: {
  equipos: Equipo[]; hoy: string; onCerrar: () => void; accion: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [itemId, setItemId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [fechaSalida, setFechaSalida] = useState(hoy);
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Agrupados por lugar, como en el inventario.
  const porLugar = useMemo(() => {
    const grupos = new Map<string, Equipo[]>();
    for (const e of equipos) {
      const lugar = e.InventarioLugar.nombre;
      grupos.set(lugar, [...(grupos.get(lugar) || []), e]);
    }
    return [...grupos.entries()];
  }, [equipos]);
  const elegido = equipos.find((e) => String(e.id) === itemId);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!elegido) return;
    setGuardando(true);
    const ok = await accion(() =>
      api.mandarMantenimiento({ inventarioItemId: elegido.id, cantidad: Number(cantidad) || 1, fechaSalida, destino, motivo }),
    );
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3 rounded-lg border border-accent bg-panel p-4 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        Mueble o equipo
        <select
          required
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value);
            setCantidad('1');
          }}
          className={`${input} mt-1 w-full`}
        >
          <option value="">Elige del inventario…</option>
          {porLugar.map(([lugar, lista]) => (
            <optgroup key={lugar} label={lugar}>
              {lista.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre}
                  {eq.disponibles > 1 ? ` (${eq.disponibles} en la clínica)` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {elegido && elegido.disponibles > 1 && (
        <label className="text-sm">
          ¿Cuántos salen?
          <input
            type="number"
            required
            min={1}
            max={elegido.disponibles}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={`${input} mt-1 w-full`}
          />
        </label>
      )}
      <label className="text-sm">
        Fecha de salida
        <input type="date" required max={hoy} value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} className={`${input} mt-1 w-full`} />
      </label>
      <label className="text-sm sm:col-span-2">
        ¿A dónde va o quién lo arregla?
        <input value={destino} onChange={(e) => setDestino(e.target.value)} maxLength={255} placeholder="Ej.: Técnico Juan, taller de carpintería…" className={`${input} mt-1 w-full`} />
      </label>
      <label className="text-sm sm:col-span-2">
        Motivo
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={2000} rows={2} placeholder="Ej.: se rompió una rueda" className={`${input} mt-1 w-full`} />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={guardando || !elegido} className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {guardando ? 'Guardando…' : 'Registrar salida'}
        </button>
        <button type="button" onClick={onCerrar} className="rounded border border-border px-4 py-2 text-sm hover:bg-accent-soft">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Afuera({ registro: r, hoy, accion }: { registro: Registro; hoy: string; accion: (fn: () => Promise<unknown>) => Promise<boolean> }) {
  const [recogiendo, setRecogiendo] = useState(false);
  const [fechaRegreso, setFechaRegreso] = useState(hoy);
  const [costo, setCosto] = useState('');
  const [trabajo, setTrabajo] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function registrarRegreso(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const ok = await accion(() => api.regresoMantenimiento(r.id, { fechaRegreso, costo, trabajoRealizado: trabajo }));
    setGuardando(false);
    if (ok) setRecogiendo(false);
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar la salida de "${r.InventarioItem.nombre}"? Úsalo solo si se anotó por error.`)) return;
    await accion(() => api.borrarMantenimiento(r.id));
  }

  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{nombreConCantidad(r)}</p>
          <p className="text-xs text-muted-foreground">
            {r.InventarioItem.InventarioLugar.nombre} ·{' '}
            {dias(r.fecha_salida, hoy) <= 0 ? 'salió hoy' : `salió el ${fmt(r.fecha_salida)} (${textoDias(dias(r.fecha_salida, hoy))} afuera)`}
            {r.destino ? ` · ${r.destino}` : ''}
          </p>
          {r.motivo && <p className="mt-1 text-xs">{r.motivo}</p>}
        </div>
        {!recogiendo && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setRecogiendo(true)} className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
              Ya volvió
            </button>
            <button type="button" onClick={borrar} className="text-xs text-danger hover:underline">
              Borrar
            </button>
          </div>
        )}
      </div>

      {recogiendo && (
        <form onSubmit={registrarRegreso} className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <label className="text-sm">
            Fecha de regreso
            <input type="date" required min={r.fecha_salida} max={hoy} value={fechaRegreso} onChange={(e) => setFechaRegreso(e.target.value)} className={`${input} mt-1 w-full`} />
          </label>
          <label className="text-sm">
            Costo del mantenimiento (Bs)
            <input type="number" min={0} step="0.01" inputMode="decimal" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="0 si no costó" className={`${input} mt-1 w-full`} />
          </label>
          <label className="text-sm sm:col-span-2">
            ¿Qué se hizo?
            <input value={trabajo} onChange={(e) => setTrabajo(e.target.value)} maxLength={2000} placeholder="Ej.: se cambió la rueda" className={`${input} mt-1 w-full`} />
          </label>
          {Number(costo) > 0 && <p className="text-xs text-muted-foreground sm:col-span-2">Bs {Number(costo).toFixed(2)} sale de caja con fecha {fmt(fechaRegreso)}.</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={guardando} className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Registrar regreso'}
            </button>
            <button type="button" onClick={() => setRecogiendo(false)} className="rounded border border-border px-4 py-2 text-sm hover:bg-accent-soft">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
