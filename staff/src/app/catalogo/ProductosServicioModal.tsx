'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Servicio } from './ServicioItem';

// Lo que usa un tratamiento y cuánto por sesión. Al completar la cita en la
// Agenda, esas cantidades se descuentan solas del inventario.

export type ProductoInventario = { id: number; nombre: string; acapite: 'insumos' | 'activos' | 'ventas'; stock: number; activo: boolean };

const CAJA: Record<ProductoInventario['acapite'], string> = { insumos: 'Insumos', activos: 'Activos', ventas: 'Ventas' };
const input = 'rounded border border-border bg-panel px-2 py-1.5 text-sm';

export default function ProductosServicioModal({
  servicio,
  todosLosProductos,
  onClose,
  onCambio,
}: {
  servicio: Servicio;
  todosLosProductos: ProductoInventario[];
  onClose: () => void;
  onCambio: () => void;
}) {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  const usados = servicio.Productos || [];
  const usadosIds = new Set(usados.map((p) => p.id));
  const disponibles = todosLosProductos.filter((p) => p.activo && !usadosIds.has(p.id));
  const porCaja = (['insumos', 'activos', 'ventas'] as const)
    .map((caja) => [caja, disponibles.filter((p) => p.acapite === caja)] as const)
    .filter(([, lista]) => lista.length > 0);
  const inventarioPorId = new Map(todosLosProductos.map((p) => [p.id, p]));

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  async function hacer(fn: () => Promise<unknown>) {
    setOcupado(true);
    setError('');
    try {
      await fn();
      onCambio();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (!productoId) return;
    if (await hacer(() => api.vincularProducto(servicio.id, Number(productoId), Number(cantidad) || 1))) {
      setProductoId('');
      setCantidad('1');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Productos que usa ${servicio.nombre}`}
        onClick={(e) => e.stopPropagation()}
        className="thin-scroll max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-panel p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Lo que usa este tratamiento</h2>
            <p className="text-sm text-muted-foreground">{servicio.nombre} · por cada sesión</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-xs text-muted-foreground">
          Al marcar la cita como <span className="font-medium text-foreground">Completada</span> en la Agenda, estas cantidades se descuentan solas del
          inventario. Si se deshace, vuelven.
        </p>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <div className="mb-5 flex flex-col gap-2">
          {usados.map((p) => {
            const enInventario = inventarioPorId.get(p.id);
            return (
              <FilaUso
                key={p.id}
                nombre={p.nombre}
                caja={enInventario ? CAJA[enInventario.acapite] : null}
                stock={enInventario?.stock ?? null}
                cantidad={p.ServicioProducto?.cantidad ?? 1}
                ocupado={ocupado}
                onCantidad={(n) => hacer(() => api.cantidadProductoServicio(servicio.id, p.id, n))}
                onQuitar={() => hacer(() => api.desvincularProducto(servicio.id, p.id))}
              />
            );
          })}
          {usados.length === 0 && <p className="text-sm text-muted-foreground">Todavía no tiene productos: no descuenta nada al completarse.</p>}
        </div>

        <form onSubmit={agregar} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <label className="min-w-0 flex-1 text-sm">
            Agregar producto
            <select value={productoId} onChange={(e) => setProductoId(e.target.value)} className={`${input} mt-1 w-full`}>
              <option value="">Elige del inventario…</option>
              {porCaja.map(([caja, lista]) => (
                <optgroup key={caja} label={CAJA[caja]}>
                  {lista.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (hay {p.stock})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Por sesión
            <input type="number" min={1} max={1000} value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={`${input} mt-1 block w-24`} />
          </label>
          <button type="submit" disabled={!productoId || ocupado} className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50">
            Agregar
          </button>
        </form>
        {porCaja.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">No hay más productos en el inventario. Agrégalos en Inventario → Insumos o Activos.</p>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent-soft">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

function FilaUso({ nombre, caja, stock, cantidad, ocupado, onCantidad, onQuitar }: {
  nombre: string;
  caja: string | null;
  stock: number | null;
  cantidad: number;
  ocupado: boolean;
  onCantidad: (n: number) => Promise<boolean>;
  onQuitar: () => void;
}) {
  const [valor, setValor] = useState(String(cantidad));
  const cambio = Number(valor) !== cantidad;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-medium">{nombre}</p>
        <p className="text-xs text-muted-foreground">
          {caja ? `${caja} · ` : ''}
          {stock !== null ? `hay ${stock}` : ''}
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (cambio) void onCantidad(Number(valor));
        }}
        className="flex items-center gap-2"
      >
        <input type="number" min={1} max={1000} value={valor} onChange={(e) => setValor(e.target.value)} aria-label={`Cantidad de ${nombre} por sesión`} className={`${input} w-20`} />
        <span className="text-xs text-muted-foreground">por sesión</span>
        {cambio && (
          <button type="submit" disabled={ocupado} className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground disabled:opacity-50">
            Guardar
          </button>
        )}
        <button type="button" onClick={onQuitar} disabled={ocupado} className="text-xs text-danger hover:underline disabled:opacity-50">
          Quitar
        </button>
      </form>
    </div>
  );
}
