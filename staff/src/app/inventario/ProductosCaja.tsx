'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

// Una caja del inventario: insumos (jeringas, guantes…), activos (lo que usa la
// doctora en los tratamientos) o ventas (lo que se vende). Se suma lo que llega y
// se resta lo que se usa a mano; lo de los tratamientos se descuenta solo al
// completar la cita, y lo vendido al cobrar.

export type Acapite = 'insumos' | 'activos' | 'ventas';
export type ProductoVenta = {
  id: number;
  nombre: string;
  codigo: string | null;
  acapite: Acapite;
  stock: number;
  stock_minimo: number;
  precio_venta: string;
  imagen_url: string | null;
  activo: boolean;
  Marca: { nombre: string } | null;
};

export const CAJAS: Record<Acapite, { titulo: string; descripcion: string }> = {
  insumos: { titulo: 'Insumos', descripcion: 'Lo que se gasta en la atención: jeringas, agujas, guantes, gasas…' },
  activos: { titulo: 'Activos', descripcion: 'Lo que usa la doctora en los tratamientos: medicamentos, ácidos, toxina…' },
  ventas: { titulo: 'Ventas', descripcion: 'Lo que se vende a los pacientes: cremas, sérums, protector solar…' },
};

// Se avisa cuando queda el mínimo o menos (o se acabó).
export const seAcaba = (p: ProductoVenta) => p.stock === 0 || (p.stock_minimo > 0 && p.stock <= p.stock_minimo);

const input = 'rounded border border-border bg-panel px-2 py-1 text-sm';

export default function ProductosCaja({ acapite, productos, onCambio }: {
  acapite: Acapite; productos: ProductoVenta[]; onCambio: () => Promise<void> | void;
}) {
  const conPrecio = acapite === 'ventas';
  const [buscar, setBuscar] = useState('');
  const [soloAcaban, setSoloAcaban] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', stock: '', minimo: '', precio: '', codigo: '' });
  const [error, setError] = useState('');
  const [historialDe, setHistorialDe] = useState<ProductoVenta | null>(null);

  const q = buscar.trim().toLowerCase();
  const deLaCaja = productos.filter((p) => p.acapite === acapite && p.activo);
  const lista = deLaCaja
    .filter((p) => !q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q))
    .filter((p) => !soloAcaban || seAcaba(p));
  const cantidadAcaban = deLaCaja.filter(seAcaba).length;

  async function accion(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await onCambio();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
      return false;
    }
  }

  async function crear(e: FormEvent) {
    e.preventDefault();
    const ok = await accion(() => api.crearProductoVenta({
      acapite,
      nombre: nuevo.nombre,
      stock: nuevo.stock === '' ? 0 : Number(nuevo.stock),
      stock_minimo: nuevo.minimo === '' ? 0 : Number(nuevo.minimo),
      codigo: nuevo.codigo,
      ...(conPrecio ? { precio_venta: nuevo.precio === '' ? 0 : Number(nuevo.precio) } : {}),
    }));
    if (ok) setNuevo({ nombre: '', stock: '', minimo: '', precio: '', codigo: '' });
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">
            {CAJAS[acapite].titulo} <span className="text-sm font-normal text-muted-foreground">({deLaCaja.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground">{CAJAS[acapite].descripcion}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cantidadAcaban > 0 && (
            <button
              type="button"
              onClick={() => setSoloAcaban((v) => !v)}
              aria-pressed={soloAcaban}
              className={`rounded-lg border px-3 py-1.5 text-xs ${soloAcaban ? 'border-stat-rose bg-stat-rose-soft text-stat-rose' : 'border-border text-stat-rose hover:bg-accent-soft'}`}
            >
              {cantidadAcaban} se {cantidadAcaban === 1 ? 'está acabando' : 'están acabando'}
            </button>
          )}
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar…" className={`${input} w-48 text-xs`} />
          {!agregando && (
            <button type="button" onClick={() => setAgregando(true)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">+ Producto</button>
          )}
        </div>
      </div>

      {agregando && (
        <form onSubmit={crear} className="mb-3 flex flex-wrap items-center gap-2 rounded border border-border p-2">
          <input autoFocus required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Producto" maxLength={255} className={`${input} min-w-0 flex-1`} />
          <input type="number" min={0} value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })} placeholder="Cuántos hay" aria-label="Cuántos hay" className={`${input} w-28`} />
          <input type="number" min={0} value={nuevo.minimo} onChange={(e) => setNuevo({ ...nuevo, minimo: e.target.value })} placeholder="Avisar con" title="Avisar cuando queden esta cantidad o menos" aria-label="Avisar cuando queden" className={`${input} w-28`} />
          {conPrecio && <input type="number" min={0} step="0.01" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })} placeholder="Precio Bs" aria-label="Precio" className={`${input} w-28`} />}
          <input value={nuevo.codigo} onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })} placeholder="Código (opcional)" maxLength={255} className={`${input} w-36`} />
          <button type="submit" className="rounded bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Agregar</button>
          <button type="button" onClick={() => setAgregando(false)} className="text-xs text-muted-foreground hover:underline">Cerrar</button>
        </form>
      )}

      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {lista.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-2 font-medium">Producto</th>
                <th className="w-28 py-1 pr-2 font-medium">Cuántos hay</th>
                <th className="w-24 py-1 pr-2 font-medium" title="Se avisa cuando quedan esta cantidad o menos">Avisar con</th>
                {conPrecio && <th className="w-28 py-1 pr-2 font-medium">Precio</th>}
                <th className="w-80 py-1 font-medium" />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => <Fila key={p.id} producto={p} conPrecio={conPrecio} accion={accion} onHistorial={() => setHistorialDe(p)} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-2 text-sm text-muted-foreground">
          {q || soloAcaban ? 'Sin resultados.' : `Todavía no hay productos en ${CAJAS[acapite].titulo}. Agrégalos con "+ Producto".`}
        </p>
      )}

      {historialDe && createPortal(<HistorialProducto producto={historialDe} onClose={() => setHistorialDe(null)} />, document.body)}
    </div>
  );
}

function Fila({ producto: p, conPrecio, accion, onHistorial }: {
  producto: ProductoVenta; conPrecio: boolean; accion: (fn: () => Promise<unknown>) => Promise<boolean>; onHistorial: () => void;
}) {
  const [movimiento, setMovimiento] = useState<'ingreso' | 'uso' | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [editando, setEditando] = useState(false);
  const [d, setD] = useState({ nombre: '', precio: '', codigo: '', minimo: '' });

  async function mover(e: FormEvent) {
    e.preventDefault();
    if (!movimiento) return;
    if (await accion(() => api.movimientoProductoVenta(p.id, { tipo: movimiento, cantidad: Number(cantidad) }))) {
      setMovimiento(null);
      setCantidad('1');
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const ok = await accion(() => api.actualizarProductoVenta(p.id, {
      nombre: d.nombre,
      codigo: d.codigo,
      stock_minimo: d.minimo === '' ? 0 : Number(d.minimo),
      ...(conPrecio ? { precio_venta: d.precio === '' ? 0 : Number(d.precio) } : {}),
    }));
    if (ok) setEditando(false);
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${p.nombre}"?`)) return;
    await accion(() => api.borrarProductoVenta(p.id));
  }

  const sinPrecio = conPrecio && !(Number(p.precio_venta) > 0);
  const acaba = seAcaba(p);

  if (editando) {
    return (
      <tr className="border-t border-border">
        <td colSpan={conPrecio ? 5 : 4} className="py-1.5">
          <form onSubmit={guardar} className="flex flex-wrap items-center gap-2">
            <input autoFocus required value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} maxLength={255} aria-label="Producto" className={`${input} min-w-0 flex-1`} />
            <input type="number" min={0} value={d.minimo} onChange={(e) => setD({ ...d, minimo: e.target.value })} placeholder="Avisar con" aria-label="Avisar cuando queden" className={`${input} w-28`} />
            {conPrecio && <input type="number" min={0} step="0.01" value={d.precio} onChange={(e) => setD({ ...d, precio: e.target.value })} aria-label="Precio" className={`${input} w-28`} />}
            <input value={d.codigo} onChange={(e) => setD({ ...d, codigo: e.target.value })} placeholder="Código" maxLength={255} aria-label="Código" className={`${input} w-36`} />
            <button type="submit" className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">Guardar</button>
            <button type="button" onClick={() => setEditando(false)} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border align-top">
      <td className="py-1.5 pr-2">
        {p.nombre}
        {(p.codigo || p.Marca) && <p className="text-xs text-muted-foreground">{[p.codigo && `Cód. ${p.codigo}`, p.Marca?.nombre].filter(Boolean).join(' · ')}</p>}
      </td>
      <td className="py-1.5 pr-2">
        <span className={`font-medium tabular-nums ${acaba ? 'text-stat-rose' : ''}`}>{p.stock}</span>
        {acaba && <span className="ml-1.5 text-xs text-stat-rose">{p.stock === 0 ? 'se acabó' : 'se está acabando'}</span>}
      </td>
      <td className="py-1.5 pr-2 tabular-nums text-muted-foreground">{p.stock_minimo || '—'}</td>
      {conPrecio && <td className={`py-1.5 pr-2 tabular-nums ${sinPrecio ? 'text-stat-amber' : ''}`}>{sinPrecio ? 'Sin precio' : `Bs ${Number(p.precio_venta).toFixed(2)}`}</td>}
      <td className="py-1.5 text-right">
        {movimiento ? (
          <form onSubmit={mover} className="inline-flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{movimiento === 'ingreso' ? 'Llegaron' : 'Se usaron'}</span>
            <input autoFocus type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} aria-label="Cantidad" className={`${input} w-16`} />
            <button type="submit" className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">OK</button>
            <button type="button" onClick={() => setMovimiento(null)} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
          </form>
        ) : (
          <>
            <button type="button" onClick={() => setMovimiento('ingreso')} className="text-xs text-accent hover:underline">+ Llegaron</button>
            {!conPrecio && <button type="button" onClick={() => setMovimiento('uso')} disabled={p.stock === 0} className="ml-2 text-xs text-accent hover:underline disabled:opacity-40">− Se usaron</button>}
            <button type="button" onClick={onHistorial} className="ml-2 text-xs text-muted-foreground hover:underline">Historial</button>
            <button
              type="button"
              onClick={() => {
                setD({ nombre: p.nombre, precio: String(Number(p.precio_venta) || ''), codigo: p.codigo || '', minimo: p.stock_minimo ? String(p.stock_minimo) : '' });
                setEditando(true);
              }}
              className="ml-2 text-xs text-muted-foreground hover:underline"
            >
              Editar
            </button>
            <button type="button" onClick={borrar} className="ml-2 text-xs text-danger hover:underline">Borrar</button>
          </>
        )}
      </td>
    </tr>
  );
}

type MovimientoHistorial = { tipo: string; cantidad: number; fecha: string; detalle: string; usuario: string | null };

const ETIQUETA: Record<string, string> = {
  ingreso: 'Llegaron',
  compra: 'Compra',
  venta: 'Venta',
  uso: 'Se usaron',
  cita: 'Tratamiento',
  cita_revertida: 'Devuelto',
};

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

function HistorialProducto({ producto, onClose }: { producto: ProductoVenta; onClose: () => void }) {
  const [movimientos, setMovimientos] = useState<MovimientoHistorial[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    api
      .historialProducto(producto.id)
      .then((r: { movimientos: MovimientoHistorial[] }) => vigente && setMovimientos(r.movimientos))
      .catch((err: unknown) => vigente && setError(err instanceof Error ? err.message : 'No se pudo cargar el historial'));
    return () => {
      vigente = false;
    };
  }, [producto.id]);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Historial de ${producto.nombre}`}
        onClick={(e) => e.stopPropagation()}
        className="thin-scroll max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-panel p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Historial</h2>
            <p className="text-sm text-muted-foreground">
              {producto.nombre} · hay {producto.stock}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            ✕
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {!movimientos && !error && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {movimientos && movimientos.length === 0 && <p className="text-sm text-muted-foreground">Todavía no tiene movimientos.</p>}
        {movimientos && movimientos.length > 0 && (
          <div className="flex flex-col divide-y divide-border text-sm">
            {movimientos.map((m, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">{ETIQUETA[m.tipo] || m.tipo}</span>
                    <span className="text-muted-foreground"> · {fmtFecha(m.fecha)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.detalle}
                    {m.usuario ? ` · ${m.usuario}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 font-medium tabular-nums ${m.cantidad > 0 ? 'text-stat-green' : m.cantidad < 0 ? 'text-stat-rose' : 'text-muted-foreground'}`}>
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
