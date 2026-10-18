'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

// Un acápite de Ventas (pedido de la doctora): solo qué producto y cuántos hay.
// Se suma lo que llega; en Activos y Mantenimiento también se descuenta lo que
// se usa. En Ventas lo vendido se descuenta solo al cobrar.

export type Acapite = 'ventas' | 'activos' | 'mantenimiento';
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

const input = 'rounded border border-border px-2 py-1 text-sm';

export default function AcapiteProductos({ acapite, titulo, productos, onCambio }: {
  acapite: Acapite; titulo: string; productos: ProductoVenta[]; onCambio: () => Promise<void> | void;
}) {
  const conPrecio = acapite === 'ventas';
  const [buscar, setBuscar] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', stock: '', precio: '', codigo: '' });
  const [error, setError] = useState('');

  const q = buscar.trim().toLowerCase();
  const lista = productos
    .filter((p) => p.acapite === acapite && p.activo)
    .filter((p) => !q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').includes(q));

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
      acapite, nombre: nuevo.nombre, stock: nuevo.stock === '' ? 0 : Number(nuevo.stock), codigo: nuevo.codigo,
      ...(conPrecio ? { precio_venta: nuevo.precio === '' ? 0 : Number(nuevo.precio) } : {}),
    }));
    if (ok) setNuevo({ nombre: '', stock: '', precio: '', codigo: '' });
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{titulo} <span className="text-sm font-normal text-muted-foreground">({lista.length})</span></h2>
        <div className="flex flex-wrap items-center gap-2">
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
          {conPrecio && <input type="number" min={0} step="0.01" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })} placeholder="Precio Bs" aria-label="Precio" className={`${input} w-28`} />}
          <input value={nuevo.codigo} onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })} placeholder="Código (opcional)" maxLength={255} className={`${input} w-36`} />
          <button type="submit" className="rounded bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Agregar</button>
          <button type="button" onClick={() => setAgregando(false)} className="text-xs text-muted-foreground hover:underline">Cerrar</button>
        </form>
      )}

      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {lista.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-2 font-medium">Producto</th>
                <th className="w-28 py-1 pr-2 font-medium">Cuántos hay</th>
                {conPrecio && <th className="w-28 py-1 pr-2 font-medium">Precio</th>}
                <th className="w-72 py-1 font-medium" />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => <Fila key={p.id} producto={p} conPrecio={conPrecio} accion={accion} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-2 text-sm text-muted-foreground">{q ? 'Sin resultados.' : 'Todavía no hay productos en este acápite.'}</p>
      )}
    </div>
  );
}

function Fila({ producto: p, conPrecio, accion }: { producto: ProductoVenta; conPrecio: boolean; accion: (fn: () => Promise<unknown>) => Promise<boolean> }) {
  const [movimiento, setMovimiento] = useState<'ingreso' | 'uso' | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [editando, setEditando] = useState(false);
  const [d, setD] = useState({ nombre: '', precio: '', codigo: '' });

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
    const ok = await accion(() => api.actualizarProductoVenta(p.id, { nombre: d.nombre, codigo: d.codigo, ...(conPrecio ? { precio_venta: d.precio === '' ? 0 : Number(d.precio) } : {}) }));
    if (ok) setEditando(false);
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${p.nombre}"?`)) return;
    await accion(() => api.borrarProductoVenta(p.id));
  }

  const sinPrecio = conPrecio && !(Number(p.precio_venta) > 0);

  if (editando) {
    return (
      <tr className="border-t border-border">
        <td colSpan={conPrecio ? 4 : 3} className="py-1.5">
          <form onSubmit={guardar} className="flex flex-wrap items-center gap-2">
            <input autoFocus required value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} maxLength={255} aria-label="Producto" className={`${input} min-w-0 flex-1`} />
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
      <td className={`py-1.5 pr-2 font-medium tabular-nums ${p.stock === 0 ? 'text-danger' : ''}`}>{p.stock}</td>
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
            <button type="button" onClick={() => { setD({ nombre: p.nombre, precio: String(Number(p.precio_venta) || ''), codigo: p.codigo || '' }); setEditando(true); }} className="ml-2 text-xs text-muted-foreground hover:underline">Editar</button>
            <button type="button" onClick={borrar} className="ml-2 text-xs text-danger hover:underline">Borrar</button>
          </>
        )}
      </td>
    </tr>
  );
}
