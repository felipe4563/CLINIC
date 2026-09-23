'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { IconTrash, IconPhoto } from '@/components/icons';
import ProveedorManager, { type Proveedor } from './ProveedorManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type Producto = {
  id: number;
  nombre: string;
  Marca: { nombre: string } | null;
  stock: number;
  precio_costo: string | null;
  imagen_url: string | null;
};

function imagenSrc(imagenUrl: string | null) {
  if (!imagenUrl) return null;
  return imagenUrl.startsWith('/uploads/') ? `${API_URL}${imagenUrl}` : imagenUrl;
}

type ItemCarrito = { producto: Producto; cantidad: number; costoUnitario: string };

type CompraHistorial = {
  id: number;
  total: string;
  nota: string | null;
  Usuario: { nombre: string };
  Proveedor: { nombre: string } | null;
  CompraItems: { cantidad: number; costo_unitario: string; Producto: { nombre: string } }[];
};

export default function ComprasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [q, setQ] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [proveedorId, setProveedorId] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  const [compras, setCompras] = useState<CompraHistorial[]>([]);
  const [totalDia, setTotalDia] = useState(0);

  const [guardando, setGuardando] = useState(false);

  const cargarProductos = useCallback(async () => {
    try {
      setProductos(await api.getProductos());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    }
  }, []);

  const cargarProveedores = useCallback(async () => {
    try {
      setProveedores(await api.getProveedores());
    } catch {
      // no bloquea la vista
    }
  }, []);

  const cargarCompras = useCallback(async () => {
    try {
      const res = await api.getCompras();
      setCompras(res.compras);
      setTotalDia(res.totalDia);
    } catch {
      // no bloquea la vista
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarProveedores();
    cargarCompras();
  }, [cargarProductos, cargarProveedores, cargarCompras]);

  const productosFiltrados = productos.filter((p) => p.nombre.toLowerCase().includes(q.toLowerCase()));

  function agregarAlCarrito(producto: Producto) {
    setCarrito((c) => {
      const existente = c.find((i) => i.producto.id === producto.id);
      if (existente) {
        return c.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...c, { producto, cantidad: 1, costoUnitario: producto.precio_costo || '' }];
    });
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    setCarrito((c) => c.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i)).filter((i) => i.cantidad > 0));
  }

  function cambiarCosto(productoId: number, costoUnitario: string) {
    setCarrito((c) => c.map((i) => (i.producto.id === productoId ? { ...i, costoUnitario } : i)));
  }

  function quitarDelCarrito(productoId: number) {
    setCarrito((c) => c.filter((i) => i.producto.id !== productoId));
  }

  const total = carrito.reduce((acc, i) => acc + (Number(i.costoUnitario) || 0) * i.cantidad, 0);
  const carritoValido = carrito.length > 0 && carrito.every((i) => Number(i.costoUnitario) >= 0 && i.costoUnitario !== '');

  function limpiar() {
    setCarrito([]);
    setProveedorId('');
    setNota('');
  }

  async function registrarCompra() {
    if (!carritoValido) return;
    setGuardando(true);
    setError('');
    try {
      await api.crearCompra({
        items: carrito.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad, costoUnitario: Number(i.costoUnitario) })),
        proveedorId: proveedorId ? Number(proveedorId) : null,
        nota: nota || null,
      });
      limpiar();
      cargarProductos();
      cargarCompras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la compra');
    } finally {
      setGuardando(false);
    }
  }

  async function anular(id: number) {
    setError('');
    try {
      await api.cancelarCompra(id);
      cargarProductos();
      cargarCompras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anular la compra');
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Compras</h1>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-4">
        <ProveedorManager
          proveedores={proveedores}
          onCrear={async (datos) => {
            await api.crearProveedor(datos);
            cargarProveedores();
          }}
          onEliminar={async (id) => {
            await api.eliminarProveedor(id);
            cargarProveedores();
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div>
          <input
            type="search"
            placeholder="Buscar producto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mb-3 w-full rounded border border-border px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {productosFiltrados.map((p) => {
              const enCarrito = carrito.find((i) => i.producto.id === p.id)?.cantidad || 0;
              const src = imagenSrc(p.imagen_url);
              return (
                <button
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  className="group relative overflow-hidden rounded-xl border border-border bg-panel text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-accent hover:shadow-md active:translate-y-0 active:scale-[0.97]"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-accent-soft">
                    {src ? (
                      <img
                        src={src}
                        alt={p.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-accent/50">
                        <IconPhoto className="h-8 w-8" />
                      </div>
                    )}

                    {enCarrito > 0 && (
                      <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground shadow">
                        {enCarrito}
                      </span>
                    )}

                    <span className="absolute right-1.5 top-1.5 rounded-full bg-panel/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
                      Stock: {p.stock}
                    </span>

                    {p.precio_costo && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
                        <p className="text-xs font-medium text-white">Último costo: Bs {p.precio_costo}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <p className="truncate text-sm font-medium">{p.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.Marca?.nombre || 'Sin marca'}</p>
                  </div>
                </button>
              );
            })}
            {productosFiltrados.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Sin productos disponibles.</p>}
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-border bg-panel p-3">
          <p className="mb-2 text-sm font-semibold">Compra en curso</p>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {carrito.map((i) => {
              const src = imagenSrc(i.producto.imagen_url);
              return (
              <div key={i.producto.id} className="rounded border border-border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-accent-soft">
                      {src ? <img src={src} alt={i.producto.nombre} className="h-full w-full object-cover" /> : <IconPhoto className="h-4 w-4 text-accent/50" />}
                    </div>
                    <p className="min-w-0 flex-1 truncate">{i.producto.nombre}</p>
                  </div>
                  <button onClick={() => quitarDelCarrito(i.producto.id)} className="shrink-0 text-danger">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={i.cantidad}
                    onChange={(e) => cambiarCantidad(i.producto.id, Number(e.target.value))}
                    placeholder="Cant."
                    className="w-16 rounded border border-border px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={i.costoUnitario}
                    onChange={(e) => cambiarCosto(i.producto.id, e.target.value)}
                    placeholder="Costo unit. Bs"
                    className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-xs"
                  />
                </div>
              </div>
              );
            })}
            {carrito.length === 0 && <p className="text-xs text-muted-foreground">Toca un producto para agregarlo a la compra.</p>}
          </div>

          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="mt-3 rounded border border-border px-2.5 py-1.5 text-sm"
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <input
            placeholder="Nota (opcional)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="mt-2 rounded border border-border px-2.5 py-1.5 text-sm"
          />

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>Bs {total.toFixed(2)}</span>
          </div>

          <button
            onClick={registrarCompra}
            disabled={guardando || !carritoValido}
            className="mt-3 w-full rounded bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {guardando ? 'Registrando…' : 'Registrar compra'}
          </button>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold">Compras de hoy · Bs {totalDia.toFixed(2)}</h2>
      <div className="flex flex-col gap-2">
        {compras.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate">{c.CompraItems.map((it) => `${it.cantidad}× ${it.Producto.nombre}`).join(', ')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.Proveedor?.nombre || 'Sin proveedor'} · {c.Usuario.nombre}
                {c.nota ? ` · ${c.nota}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">Bs {Number(c.total).toFixed(2)}</span>
              <button onClick={() => anular(c.id)} className="text-xs text-danger hover:underline">
                Anular
              </button>
            </div>
          </div>
        ))}
        {compras.length === 0 && <p className="text-sm text-muted-foreground">Sin compras registradas hoy.</p>}
      </div>
    </div>
  );
}
