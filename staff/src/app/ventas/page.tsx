'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { IconTrash, IconPhoto } from '@/components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type Producto = {
  id: number;
  nombre: string;
  Marca: { nombre: string } | null;
  stock: number;
  stock_minimo: number;
  precio_venta: string;
  imagen_url: string | null;
  activo: boolean;
};

function imagenSrc(imagenUrl: string | null) {
  if (!imagenUrl) return null;
  return imagenUrl.startsWith('/uploads/') ? `${API_URL}${imagenUrl}` : imagenUrl;
}

type ItemCarrito = { producto: Producto; cantidad: number };

type VentaHistorial = {
  id: number;
  total: string;
  metodo_pago: 'efectivo' | 'qr';
  estado: 'pendiente' | 'pagado';
  cliente_nombre: string | null;
  Usuario: { nombre: string };
  VentaItems: { cantidad: number; Producto: { nombre: string } }[];
};

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [error, setError] = useState('');

  const [ventas, setVentas] = useState<VentaHistorial[]>([]);
  const [totalDia, setTotalDia] = useState(0);

  const [cobrando, setCobrando] = useState(false);
  const [ventaQR, setVentaQR] = useState<{ ventaId: number; qr: string } | null>(null);
  const [confirmada, setConfirmada] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarProductos = useCallback(async () => {
    try {
      setProductos(await api.getProductos());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    }
  }, []);

  const cargarVentas = useCallback(async () => {
    try {
      const res = await api.getVentas();
      setVentas(res.ventas);
      setTotalDia(res.totalDia);
    } catch {
      // no bloquea el POS si falla el historial
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarVentas();
  }, [cargarProductos, cargarVentas]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const productosFiltrados = productos.filter(
    (p) => p.activo !== false && p.nombre.toLowerCase().includes(q.toLowerCase()),
  );

  function agregarAlCarrito(producto: Producto) {
    setCarrito((c) => {
      const existente = c.find((i) => i.producto.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) return c;
        return c.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...c, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: number, delta: number) {
    setCarrito((c) =>
      c
        .map((i) => (i.producto.id === productoId ? { ...i, cantidad: Math.min(i.cantidad + delta, i.producto.stock) } : i))
        .filter((i) => i.cantidad > 0),
    );
  }

  function quitarDelCarrito(productoId: number) {
    setCarrito((c) => c.filter((i) => i.producto.id !== productoId));
  }

  const total = carrito.reduce((acc, i) => acc + Number(i.producto.precio_venta) * i.cantidad, 0);

  function limpiarVenta() {
    setCarrito([]);
    setClienteNombre('');
    setVentaQR(null);
    setConfirmada(false);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  async function cobrar(metodoPago: 'efectivo' | 'qr') {
    if (carrito.length === 0) return;
    setCobrando(true);
    setError('');
    try {
      const res = await api.crearVenta({
        items: carrito.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
        metodoPago,
        clienteNombre: clienteNombre || null,
      });

      if (metodoPago === 'efectivo') {
        limpiarVenta();
        cargarProductos();
        cargarVentas();
      } else {
        setVentaQR({ ventaId: res.venta.id, qr: res.qrImageBase64 });
        pollRef.current = setInterval(async () => {
          try {
            const estado = await api.estadoVentaQR(res.venta.id);
            if (estado.pagado) {
              if (pollRef.current) clearInterval(pollRef.current);
              setConfirmada(true);
              cargarProductos();
              cargarVentas();
            }
          } catch {
            // reintenta solo
          }
        }, 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta');
    } finally {
      setCobrando(false);
    }
  }

  async function cancelarVentaQR() {
    if (!ventaQR) return;
    try {
      await api.cancelarVenta(ventaQR.ventaId);
    } catch {
      // si ya no se puede cancelar, igual limpiamos la vista
    }
    limpiarVenta();
    cargarProductos();
    cargarVentas();
  }

  if (ventaQR) {
    return (
      <div className="mx-auto max-w-sm text-center">
        {confirmada ? (
          <>
            <h1 className="text-lg font-semibold">Venta confirmada</h1>
            <p className="mt-2 text-sm text-muted-foreground">El pago fue recibido correctamente.</p>
            <button onClick={limpiarVenta} className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              Nueva venta
            </button>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Cobra Bs {total.toFixed(2)} con QR</h1>
            <img src={`data:image/png;base64,${ventaQR.qr}`} alt="QR de pago" className="mx-auto mt-4 w-56" />
            <p className="mt-4 text-xs text-muted-foreground">
              Que el cliente escanee el código. Estamos revisando automáticamente si ya llegó el pago.
            </p>
            <button onClick={cancelarVentaQR} className="mt-6 rounded-lg border border-border px-4 py-2 text-sm">
              Cancelar venta
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Ventas (POS)</h1>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
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
              const stockBajo = p.stock > 0 && p.stock <= p.stock_minimo;
              const src = imagenSrc(p.imagen_url);
              return (
                <button
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  disabled={p.stock === 0}
                  className="group relative overflow-hidden rounded-xl border border-border bg-panel text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-accent hover:shadow-md active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-accent-soft">
                    {src ? (
                      <img
                        src={src}
                        alt={p.nombre}
                        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${p.stock === 0 ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-accent/50">
                        <IconPhoto className="h-8 w-8" />
                      </div>
                    )}

                    {enCarrito > 0 && (
                      <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground shadow">
                        {enCarrito}
                      </span>
                    )}

                    {stockBajo && p.stock > 0 && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-stat-rose-soft px-2 py-0.5 text-[10px] font-medium text-stat-rose shadow-sm">
                        Quedan {p.stock}
                      </span>
                    )}

                    {p.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-panel/70">
                        <span className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow">Agotado</span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
                      <p className="text-sm font-semibold text-white">Bs {p.precio_venta}</p>
                    </div>
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
          <p className="mb-2 text-sm font-semibold">Carrito</p>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {carrito.map((i) => {
              const src = imagenSrc(i.producto.imagen_url);
              return (
              <div key={i.producto.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-accent-soft">
                  {src ? <img src={src} alt={i.producto.nombre} className="h-full w-full object-cover" /> : <IconPhoto className="h-4 w-4 text-accent/50" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{i.producto.nombre}</p>
                  <p className="text-xs text-muted-foreground">Bs {i.producto.precio_venta} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(i.producto.id, -1)} className="h-6 w-6 rounded border border-border text-xs">
                    −
                  </button>
                  <span className="w-5 text-center text-xs">{i.cantidad}</span>
                  <button onClick={() => cambiarCantidad(i.producto.id, 1)} className="h-6 w-6 rounded border border-border text-xs">
                    +
                  </button>
                </div>
                <button onClick={() => quitarDelCarrito(i.producto.id)} className="text-danger">
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
              );
            })}
            {carrito.length === 0 && <p className="text-xs text-muted-foreground">Toca un producto para agregarlo.</p>}
          </div>

          <input
            placeholder="Nombre del cliente (opcional)"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            className="mt-3 rounded border border-border px-2.5 py-1.5 text-sm"
          />

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>Bs {total.toFixed(2)}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => cobrar('efectivo')}
              disabled={cobrando || carrito.length === 0}
              className="flex-1 rounded border border-border px-3 py-2 text-sm font-medium hover:bg-accent-soft disabled:opacity-50"
            >
              Efectivo
            </button>
            <button
              onClick={() => cobrar('qr')}
              disabled={cobrando || carrito.length === 0}
              className="flex-1 rounded bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {cobrando ? 'Procesando…' : 'Cobrar con QR'}
            </button>
          </div>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold">Ventas de hoy · Bs {totalDia.toFixed(2)}</h2>
      <div className="flex flex-col gap-2">
        {ventas.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate">
                {v.VentaItems.map((it) => `${it.cantidad}× ${it.Producto.nombre}`).join(', ')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {v.cliente_nombre || 'Cliente mostrador'} · {v.Usuario.nombre}
                {v.estado === 'pendiente' ? ' · Pendiente de pago' : ''}
              </p>
            </div>
            <span className="font-medium">Bs {Number(v.total).toFixed(2)}</span>
          </div>
        ))}
        {ventas.length === 0 && <p className="text-sm text-muted-foreground">Sin ventas registradas hoy.</p>}
      </div>
    </div>
  );
}
