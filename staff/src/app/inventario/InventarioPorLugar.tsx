'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

// Inventario por lugar: el material de la oficina como lo lleva la clínica en
// sus planillas (un lugar por pestaña, separado por tipo y en su orden).

type Tipo = 'equipamiento' | 'equipos' | 'insumos' | 'activos' | 'decorativos';
type Estado = 'bueno' | 'mantenimiento' | 'baja';
type Item = {
  id: number;
  lugar_id: number;
  tipo: Tipo;
  nombre: string;
  cantidad: number | null;
  estado: Estado;
  fecha_ingreso: string | null;
  observacion: string | null;
};
type Lugar = { id: number; nombre: string; InventarioItems: Item[] };

const TIPOS: { clave: Tipo; titulo: string }[] = [
  { clave: 'equipamiento', titulo: 'Equipamiento' },
  { clave: 'equipos', titulo: 'Equipos' },
  { clave: 'insumos', titulo: 'Insumos' },
  { clave: 'activos', titulo: 'Activos' },
  { clave: 'decorativos', titulo: 'Decorativos' },
];
const ESTADOS: { clave: Estado; texto: string; clase: string }[] = [
  { clave: 'bueno', texto: 'Bueno', clase: 'text-stat-green' },
  { clave: 'mantenimiento', texto: 'En mantenimiento', clase: 'text-stat-amber' },
  { clave: 'baja', texto: 'Dado de baja', clase: 'text-danger' },
];
const input = 'rounded border border-border px-2 py-1 text-sm';

// "2 años 3 meses" desde la fecha de ingreso (igual que el Excel).
export function tiempoDeUso(fecha: string | null, hoy = new Date()) {
  if (!fecha) return '';
  const [a, m, d] = fecha.split('-').map(Number);
  let meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m);
  if (hoy.getDate() < d) meses -= 1;
  if (meses < 1) return 'Menos de 1 mes';
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  return [anios ? `${anios} ${anios === 1 ? 'año' : 'años'}` : '', resto ? `${resto} ${resto === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean).join(' ');
}

const fechaCorta = (f: string | null) => (f ? f.split('-').reverse().join('/') : '');

export default function InventarioPorLugar() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [lugarId, setLugarId] = useState<number | null>(null);
  const [buscar, setBuscar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [nuevoLugar, setNuevoLugar] = useState<string | null>(null);
  const [renombrando, setRenombrando] = useState<string | null>(null);

  const aplicar = useCallback((datos: Lugar[]) => {
    setLugares(datos);
    setLugarId((actual) => (actual && datos.some((l) => l.id === actual) ? actual : datos.find((l) => l.InventarioItems.length)?.id ?? datos[0]?.id ?? null));
  }, []);
  const cargar = useCallback(async () => aplicar(await api.getInventarioLugares()), [aplicar]);

  useEffect(() => {
    api.getInventarioLugares()
      .then(aplicar)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el inventario'))
      .finally(() => setCargando(false));
  }, [aplicar]);

  const lugar = lugares.find((l) => l.id === lugarId) || null;
  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    const items = lugar?.InventarioItems || [];
    return q ? items.filter((i) => i.nombre.toLowerCase().includes(q) || (i.observacion || '').toLowerCase().includes(q)) : items;
  }, [lugar, buscar]);

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

  async function crearLugar(e: FormEvent) {
    e.preventDefault();
    if (!nuevoLugar?.trim()) return;
    setError('');
    try {
      const creado = await api.crearInventarioLugar(nuevoLugar.trim());
      setNuevoLugar(null);
      await cargar();
      setLugarId(creado.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el lugar');
    }
  }

  async function guardarNombreLugar(e: FormEvent) {
    e.preventDefault();
    if (!lugar || !renombrando?.trim()) return;
    if (await accion(() => api.renombrarInventarioLugar(lugar.id, renombrando.trim()))) setRenombrando(null);
  }

  async function borrarLugar() {
    if (!lugar || !window.confirm(`¿Borrar el lugar "${lugar.nombre}"?`)) return;
    await accion(() => api.borrarInventarioLugar(lugar.id));
  }

  async function descargar(id?: number) {
    setError('');
    try {
      await api.descargarInventarioExcel(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el Excel');
    }
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {lugares.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => { setLugarId(l.id); setRenombrando(null); }}
            className={`rounded-full border px-3 py-1 text-xs ${l.id === lugarId ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'}`}
          >
            {l.nombre} <span className="opacity-70">({l.InventarioItems.length})</span>
          </button>
        ))}
        {nuevoLugar === null ? (
          <button type="button" onClick={() => setNuevoLugar('')} className="rounded-full border border-dashed border-border px-3 py-1 text-xs hover:bg-accent-soft">
            + Lugar
          </button>
        ) : (
          <form onSubmit={crearLugar} className="flex items-center gap-1">
            <input autoFocus value={nuevoLugar} onChange={(e) => setNuevoLugar(e.target.value)} placeholder="Ej. Consultorio 3" maxLength={255} className={`${input} w-40 text-xs`} />
            <button type="submit" className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">Crear</button>
            <button type="button" onClick={() => setNuevoLugar(null)} className="px-1 text-xs text-muted-foreground hover:underline">Cancelar</button>
          </form>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {lugar ? (
        <div className="rounded-lg border border-border bg-panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {renombrando === null ? (
              <h2 className="text-base font-semibold">
                Inventario {lugar.nombre}
                <button type="button" onClick={() => setRenombrando(lugar.nombre)} className="ml-2 text-xs font-normal text-muted-foreground hover:underline">Renombrar</button>
                {lugar.InventarioItems.length === 0 && (
                  <button type="button" onClick={borrarLugar} className="ml-2 text-xs font-normal text-danger hover:underline">Borrar lugar</button>
                )}
              </h2>
            ) : (
              <form onSubmit={guardarNombreLugar} className="flex items-center gap-1">
                <input autoFocus value={renombrando} onChange={(e) => setRenombrando(e.target.value)} maxLength={255} className={input} aria-label="Nombre del lugar" />
                <button type="submit" className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">Guardar</button>
                <button type="button" onClick={() => setRenombrando(null)} className="px-1 text-xs text-muted-foreground hover:underline">Cancelar</button>
              </form>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar en este lugar…" className={`${input} w-52 text-xs`} />
              <button type="button" onClick={() => descargar(lugar.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">Excel de este lugar</button>
              <button type="button" onClick={() => descargar()} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">Excel de todo</button>
            </div>
          </div>

          {TIPOS.map((t) => (
            <SeccionTipo
              key={t.clave}
              titulo={t.titulo}
              tipo={t.clave}
              lugarId={lugar.id}
              items={visibles.filter((i) => i.tipo === t.clave)}
              filtrando={Boolean(buscar.trim())}
              accion={accion}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay lugares. Crea el primero con “+ Lugar”.</p>
      )}
    </div>
  );
}

function SeccionTipo({ titulo, tipo, lugarId, items, filtrando, accion }: {
  titulo: string; tipo: Tipo; lugarId: number; items: Item[]; filtrando: boolean; accion: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState({ cantidad: '1', nombre: '' });

  if (filtrando && !items.length) return null;

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return;
    const ok = await accion(() => api.crearInventarioItem({ lugar_id: lugarId, tipo, nombre: nuevo.nombre, cantidad: nuevo.cantidad === '' ? null : Number(nuevo.cantidad) }));
    if (ok) setNuevo({ cantidad: '1', nombre: '' });
  }

  return (
    <section className="mb-5">
      <div className="mb-1.5 flex items-center justify-between border-b border-border pb-1">
        <h3 className="text-sm font-bold uppercase tracking-wide">{titulo} <span className="font-normal normal-case text-muted-foreground">({items.length})</span></h3>
        {!agregando && <button type="button" onClick={() => setAgregando(true)} className="text-xs text-accent hover:underline">+ Agregar</button>}
      </div>
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="w-20 py-1 pr-2 font-medium">Cant.</th>
                <th className="py-1 pr-2 font-medium">Nombre</th>
                <th className="w-36 py-1 pr-2 font-medium">Estado</th>
                <th className="w-28 py-1 pr-2 font-medium">Ingreso</th>
                <th className="w-32 py-1 pr-2 font-medium">Tiempo de uso</th>
                <th className="w-32 py-1 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => <FilaItem key={i.id} item={i} accion={accion} />)}
            </tbody>
          </table>
        </div>
      )}
      {!items.length && !agregando && <p className="py-1 text-xs text-muted-foreground">Nada cargado.</p>}
      {agregando && (
        <form onSubmit={agregar} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="number" min={0} value={nuevo.cantidad} onChange={(e) => setNuevo({ ...nuevo, cantidad: e.target.value })} aria-label="Cantidad" className={`${input} w-20`} />
          <input autoFocus value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder={`Nuevo en ${titulo.toLowerCase()}`} maxLength={500} className={`${input} min-w-0 flex-1`} />
          <button type="submit" className="rounded bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Agregar</button>
          <button type="button" onClick={() => setAgregando(false)} className="text-xs text-muted-foreground hover:underline">Cerrar</button>
        </form>
      )}
    </section>
  );
}

function FilaItem({ item, accion }: { item: Item; accion: (fn: () => Promise<unknown>) => Promise<boolean> }) {
  const [editando, setEditando] = useState(false);
  const [d, setD] = useState({ cantidad: '', nombre: '', estado: 'bueno' as Estado, fecha_ingreso: '', observacion: '' });
  const estado = ESTADOS.find((e) => e.clave === item.estado);

  function editar() {
    setD({
      cantidad: item.cantidad === null ? '' : String(item.cantidad), nombre: item.nombre, estado: item.estado,
      fecha_ingreso: item.fecha_ingreso || '', observacion: item.observacion || '',
    });
    setEditando(true);
  }

  async function guardar() {
    const ok = await accion(() => api.actualizarInventarioItem(item.id, {
      cantidad: d.cantidad === '' ? null : Number(d.cantidad), nombre: d.nombre, estado: d.estado, fecha_ingreso: d.fecha_ingreso || null, observacion: d.observacion,
    }));
    if (ok) setEditando(false);
  }

  if (editando) {
    return (
      <tr className="border-t border-border align-top">
        <td className="py-1.5 pr-2"><input type="number" min={0} value={d.cantidad} onChange={(e) => setD({ ...d, cantidad: e.target.value })} aria-label="Cantidad" className={`${input} w-16`} /></td>
        <td className="py-1.5 pr-2">
          <input value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} maxLength={500} aria-label="Nombre" className={`${input} w-full`} />
          <input value={d.observacion} onChange={(e) => setD({ ...d, observacion: e.target.value })} maxLength={2000} placeholder="Observación (opcional)" aria-label="Observación" className={`${input} mt-1 w-full text-xs`} />
        </td>
        <td className="py-1.5 pr-2">
          <select value={d.estado} onChange={(e) => setD({ ...d, estado: e.target.value as Estado })} aria-label="Estado" className={`${input} w-full`}>
            {ESTADOS.map((e) => <option key={e.clave} value={e.clave}>{e.texto}</option>)}
          </select>
        </td>
        <td className="py-1.5 pr-2" colSpan={2}><input type="date" value={d.fecha_ingreso} onChange={(e) => setD({ ...d, fecha_ingreso: e.target.value })} aria-label="Fecha de ingreso" className={input} /></td>
        <td className="py-1.5 text-right">
          <button type="button" onClick={guardar} className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">Guardar</button>
          <button type="button" onClick={() => setEditando(false)} className="ml-1 text-xs text-muted-foreground hover:underline">Cancelar</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-t border-border align-top ${item.estado === 'baja' ? 'opacity-60' : ''}`}>
      <td className="py-1.5 pr-2 tabular-nums">{item.cantidad ?? '—'}</td>
      <td className="py-1.5 pr-2">
        {item.nombre}
        {item.observacion && <p className="text-xs text-muted-foreground">{item.observacion}</p>}
      </td>
      <td className={`py-1.5 pr-2 text-xs ${estado?.clase || ''}`}>{estado?.texto}</td>
      <td className="py-1.5 pr-2 text-xs">{fechaCorta(item.fecha_ingreso)}</td>
      <td className="py-1.5 pr-2 text-xs">{tiempoDeUso(item.fecha_ingreso)}</td>
      <td className="py-1.5 text-right">
        <button type="button" onClick={editar} className="text-xs text-accent hover:underline">Editar</button>
        <button
          type="button"
          onClick={() => window.confirm(`¿Borrar "${item.nombre}"?`) && accion(() => api.borrarInventarioItem(item.id))}
          className="ml-2 text-xs text-danger hover:underline"
        >
          Borrar
        </button>
      </td>
    </tr>
  );
}
