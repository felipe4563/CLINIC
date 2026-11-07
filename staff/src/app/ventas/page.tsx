'use client';

import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { imprimirComprobanteVenta } from '@/lib/comprobanteVenta';
import { IconTrash, IconPhoto, IconChevronDown, IconShoppingCart, IconSearch } from '@/components/icons';
import type { ProductoVenta } from '../inventario/ProductosCaja';

function hoyISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Atajos del historial; la semana empieza el lunes.
const RANGOS_RAPIDOS: { texto: string; calcular: () => { desde: string; hasta: string } }[] = [
  { texto: 'Hoy', calcular: () => ({ desde: hoyISO(), hasta: hoyISO() }) },
  {
    texto: 'Ayer',
    calcular: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { desde: hoyISO(d), hasta: hoyISO(d) };
    },
  },
  {
    texto: 'Esta semana',
    calcular: () => {
      const d = new Date();
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return { desde: hoyISO(d), hasta: hoyISO() };
    },
  },
  {
    texto: 'Este mes',
    calcular: () => {
      const d = new Date();
      return { desde: hoyISO(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: hoyISO() };
    },
  },
];

// 2026-11-02 -> "lunes 02/11/2026"
function diaLegible(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  const dia = new Date(a, m - 1, d).toLocaleDateString('es-BO', { weekday: 'long' });
  return `${dia} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type Producto = ProductoVenta;

// Ventas es solo cobrar y ver lo vendido; los productos (precio, cuántos hay) se
// manejan en Inventario → Ventas, y el mantenimiento de equipos en Inventario.
type Pestana = 'vender' | 'historial';
const PESTANAS: { clave: Pestana; texto: string }[] = [
  { clave: 'vender', texto: 'Ventas' },
  { clave: 'historial', texto: 'Historial' },
];

function imagenSrc(imagenUrl: string | null) {
  if (!imagenUrl) return null;
  return imagenUrl.startsWith('/uploads/') ? `${API_URL}${imagenUrl}` : imagenUrl;
}

type ItemCarrito = { producto: Producto; cantidad: number };

type EstadoProducto = 'disponible' | 'sin_precio' | 'agotado';
type Filtro = 'todos' | EstadoProducto;
const FILTROS: { clave: Filtro; texto: string }[] = [
  { clave: 'todos', texto: 'Todos' },
  { clave: 'disponible', texto: 'Disponibles' },
  { clave: 'sin_precio', texto: 'Sin precio' },
  { clave: 'agotado', texto: 'Agotados' },
];
const ORDEN: Record<EstadoProducto, number> = { disponible: 0, sin_precio: 1, agotado: 2 };

function estadoDe(p: Producto): EstadoProducto {
  if (!(Number(p.precio_venta) > 0)) return 'sin_precio';
  return p.stock > 0 ? 'disponible' : 'agotado';
}

// Igual que la reserva web: QR del banco (se confirma solo) o el QR fijo de la clínica
// (el personal confirma). Sin ninguno de los dos, solo se cobra en efectivo.
type ModoQR = 'banco' | 'fijo' | null;
type VentaQR = { ventaId: number; modo: 'banco'; qr: string } | { ventaId: number; modo: 'fijo'; url: string; datos: string | null };

type PacienteBusqueda = { id: number; nombre_completo: string; telefono: string };

type VentaHistorial = {
  id: number;
  fecha: string;
  total: string;
  subtotal: string | null;
  descuento_porcentaje: string;
  metodo_pago: 'efectivo' | 'qr';
  estado: 'pendiente' | 'pagado';
  cliente_nombre: string | null;
  Paciente: { nombre_completo: string } | null;
  Usuario: { nombre: string };
  VentaItems: { cantidad: number; precio_unitario: string; Producto: { nombre: string } }[];
};

export default function VentasPage() {
  const [tab, setTab] = useState<Pestana>('vender');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [marca, setMarca] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  // Descuento de la venta, solo en % (los descuentos en Bs son de tratamientos).
  const [descuento, setDescuento] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteBusqueda | null>(null);
  const [sugerenciasPacientes, setSugerenciasPacientes] = useState<PacienteBusqueda[]>([]);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [error, setError] = useState('');

  const [rango, setRango] = useState(() => ({ desde: hoyISO(), hasta: hoyISO() }));
  const [ventas, setVentas] = useState<VentaHistorial[]>([]);
  const [totalDia, setTotalDia] = useState(0);

  const [ventasExpandidas, setVentasExpandidas] = useState<Set<number>>(new Set());

  function toggleVentaExpandida(id: number) {
    setVentasExpandidas((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  const [cobrando, setCobrando] = useState(false);
  const [ventaQR, setVentaQR] = useState<VentaQR | null>(null);
  // Aviso de la última venta cobrada, con su comprobante a mano para imprimir.
  const [aviso, setAviso] = useState<{ texto: string; ventaId: number } | null>(null);
  const [imprimiendo, setImprimiendo] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [modoQR, setModoQR] = useState<ModoQR>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const carritoRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);

  // En la computadora el buscador queda listo para el lector de códigos; en el
  // celular no, para que no se abra el teclado solo.
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) buscadorRef.current?.focus();
  }, []);

  useEffect(() => {
    api
      .getConfiguracionPublica()
      .then((c: { metodo_pago_online: string; qr_fijo_url: string | null }) =>
        setModoQR(c.metodo_pago_online === 'qr_banco' ? 'banco' : c.qr_fijo_url ? 'fijo' : null),
      )
      .catch(() => setModoQR(null));
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      setProductos(await api.getProductosVenta());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    }
  }, []);

  const cargarVentas = useCallback(async ({ desde, hasta }: { desde: string; hasta: string }) => {
    try {
      const res = await api.getVentas(desde, hasta);
      setVentas(res.ventas);
      setTotalDia(res.totalDia);
    } catch {
      // no bloquea el POS si falla el historial
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  useEffect(() => {
    cargarVentas(rango);
  }, [cargarVentas, rango]);

  useEffect(() => {
    if (pacienteSeleccionado || clienteNombre.trim().length < 2) {
      setSugerenciasPacientes([]);
      return;
    }
    let vigente = true;
    setBuscandoPaciente(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.getPacientes(clienteNombre.trim());
        if (vigente) setSugerenciasPacientes(res.pacientes.slice(0, 6));
      } catch {
        if (vigente) setSugerenciasPacientes([]);
      } finally {
        if (vigente) setBuscandoPaciente(false);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(timeout);
    };
  }, [clienteNombre, pacienteSeleccionado]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Solo se vende lo del acápite Ventas; sin precio no se puede cobrar.
  const deVenta = productos.filter((p) => p.acapite === 'ventas' && p.activo !== false);
  const cantidadSinPrecio = deVenta.filter((p) => estadoDe(p) === 'sin_precio').length;
  const marcas = Array.from(new Set(deVenta.map((p) => p.Marca?.nombre).filter((m): m is string => !!m))).sort();
  const texto = q.trim().toLowerCase();
  const coincide = (p: Producto) =>
    !texto ||
    p.nombre.toLowerCase().includes(texto) ||
    (p.codigo || '').toLowerCase().includes(texto) ||
    (p.Marca?.nombre || '').toLowerCase().includes(texto);
  const buscados = deVenta.filter((p) => coincide(p) && (!marca || p.Marca?.nombre === marca));
  const conteo = (f: Filtro) => (f === 'todos' ? buscados.length : buscados.filter((p) => estadoDe(p) === f).length);
  // Lo que se puede vender va primero; después lo sin precio y al final lo agotado.
  const productosFiltrados = buscados
    .filter((p) => filtro === 'todos' || estadoDe(p) === filtro)
    .sort((a, b) => ORDEN[estadoDe(a)] - ORDEN[estadoDe(b)] || a.nombre.localeCompare(b.nombre, 'es'));

  // Enter en el buscador (o el lector de código de barras): agrega el producto
  // con ese código exacto, o el único vendible que quedó en la búsqueda.
  function agregarDesdeBuscador() {
    if (!texto) return;
    const vendibles = buscados.filter((p) => estadoDe(p) === 'disponible');
    const elegido = vendibles.find((p) => (p.codigo || '').toLowerCase() === texto) || (vendibles.length === 1 ? vendibles[0] : null);
    if (!elegido) return;
    agregarAlCarrito(elegido);
    setQ('');
  }

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

  const subtotal = carrito.reduce((acc, i) => acc + Number(i.producto.precio_venta) * i.cantidad, 0);
  const porcentaje = Number(descuento) || 0;
  const descuentoInvalido = descuento !== '' && !(porcentaje >= 0 && porcentaje <= 100);
  const montoDescuento = descuentoInvalido ? 0 : Math.round(subtotal * porcentaje) / 100;
  const total = Math.round((subtotal - montoDescuento) * 100) / 100;

  function limpiarVenta() {
    setCarrito([]);
    setDescuento('');
    setClienteNombre('');
    setPacienteSeleccionado(null);
    setSugerenciasPacientes([]);
    setVentaQR(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  // Cobrada la venta se vuelve directo a la pestaña Ventas, lista para la siguiente.
  function ventaCobrada(monto: number, ventaId: number) {
    limpiarVenta();
    setTab('vender');
    setAviso({ texto: `Venta de Bs ${monto.toFixed(2)} cobrada.`, ventaId });
    cargarProductos();
    cargarVentas(rango);
  }

  async function imprimir(ventaId: number) {
    setImprimiendo(ventaId);
    setError('');
    try {
      await imprimirComprobanteVenta(ventaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo imprimir el comprobante');
    } finally {
      setImprimiendo(null);
    }
  }

  async function cobrar(metodoPago: 'efectivo' | 'qr') {
    if (carrito.length === 0 || descuentoInvalido) return;
    setCobrando(true);
    setError('');
    try {
      const res = await api.crearVenta({
        items: carrito.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
        metodoPago,
        descuentoPorcentaje: porcentaje,
        clienteNombre: pacienteSeleccionado ? null : clienteNombre || null,
        pacienteId: pacienteSeleccionado ? pacienteSeleccionado.id : null,
      });

      if (metodoPago === 'efectivo') {
        ventaCobrada(total, res.venta.id);
      } else if (res.modo === 'fijo') {
        setVentaQR({ ventaId: res.venta.id, modo: 'fijo', url: res.qrFijo.url, datos: res.qrFijo.datos });
      } else {
        setVentaQR({ ventaId: res.venta.id, modo: 'banco', qr: res.qrImageBase64 });
        pollRef.current = setInterval(async () => {
          try {
            const estado = await api.estadoVentaQR(res.venta.id);
            if (estado.pagado) {
              ventaCobrada(total, res.venta.id);
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

  async function confirmarPagoFijo() {
    if (!ventaQR) return;
    setConfirmando(true);
    setError('');
    try {
      await api.confirmarVentaQR(ventaQR.ventaId);
      ventaCobrada(total, ventaQR.ventaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el pago');
    } finally {
      setConfirmando(false);
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
    cargarVentas(rango);
  }

  if (ventaQR) {
    return (
      <div className="mx-auto max-w-sm text-center">
          <>
            <h1 className="text-lg font-semibold">Cobra Bs {total.toFixed(2)} con QR</h1>
            {ventaQR.modo === 'banco' ? (
              <>
                <img src={`data:image/png;base64,${ventaQR.qr}`} alt="QR de pago" className="mx-auto mt-4 w-56" />
                <p className="mt-4 text-xs text-muted-foreground">
                  Que el cliente escanee el código. Estamos revisando automáticamente si ya llegó el pago.
                </p>
              </>
            ) : (
              <>
                <img src={imagenSrc(ventaQR.url)!} alt="QR de la clínica" className="mx-auto mt-4 w-56 rounded-lg bg-white object-contain p-2" />
                {ventaQR.datos && <p className="mt-3 text-sm">{ventaQR.datos}</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  Que el cliente pague Bs {total.toFixed(2)} con este QR. Cuando veas el pago en la cuenta, confírmalo.
                </p>
                {error && <p className="mt-3 text-sm text-danger">{error}</p>}
                <button
                  onClick={confirmarPagoFijo}
                  disabled={confirmando}
                  className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
                >
                  {confirmando ? 'Confirmando…' : 'Ya pagó, confirmar'}
                </button>
              </>
            )}
            <button onClick={cancelarVentaQR} className="mt-3 rounded-lg border border-border px-4 py-2 text-sm">
              Cancelar venta
            </button>
          </>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Ventas</h1>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {aviso && (
        <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stat-green/40 bg-stat-green/10 px-4 py-2.5 text-sm">
          <p>{aviso.texto}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => imprimir(aviso.ventaId)}
              disabled={imprimiendo === aviso.ventaId}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {imprimiendo === aviso.ventaId ? 'Preparando…' : 'Imprimir comprobante'}
            </button>
            <button type="button" onClick={() => setAviso(null)} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent-soft">
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {PESTANAS.map((p) => (
          <button
            key={p.clave}
            onClick={() => setTab(p.clave)}
            className={`px-3 py-2 text-sm font-medium ${tab === p.clave ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {tab === 'vender' && (
      <div className={`grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] ${carrito.length > 0 ? 'pb-20 lg:pb-0' : ''}`}>
        <div className="min-w-0">
          <div className="relative mb-3">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={buscadorRef}
              type="search"
              placeholder="Buscar producto o escanear código…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  agregarDesdeBuscador();
                }
              }}
              className="w-full rounded-lg border border-border bg-panel py-2.5 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.clave}
                type="button"
                onClick={() => setFiltro(f.clave)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filtro === f.clave ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-accent-soft'}`}
              >
                {f.texto} <span className="opacity-70">{conteo(f.clave)}</span>
              </button>
            ))}
            {marcas.length > 1 && (
              <>
                <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
                {marcas.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarca((actual) => (actual === m ? null : m))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${marca === m ? 'border-accent bg-accent-soft text-foreground' : 'border-border text-muted-foreground hover:bg-accent-soft'}`}
                  >
                    {m}
                  </button>
                ))}
              </>
            )}
          </div>

          {cantidadSinPrecio > 0 && filtro !== 'sin_precio' && (
            <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stat-amber/40 bg-stat-amber/10 px-4 py-2.5 text-sm">
              <p>
                {cantidadSinPrecio === 1 ? 'Hay 1 producto sin precio' : `Hay ${cantidadSinPrecio} productos sin precio`}: no se pueden vender hasta que tengan uno.
              </p>
              <button type="button" onClick={() => setFiltro('sin_precio')} className="rounded border border-stat-amber/50 px-3 py-1.5 text-sm font-medium hover:bg-stat-amber/10">
                Ver cuáles
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {productosFiltrados.map((p) => {
              const enCarrito = carrito.find((i) => i.producto.id === p.id)?.cantidad || 0;
              const estado = estadoDe(p);
              const vendible = estado === 'disponible';
              const stockBajo = vendible && p.stock <= p.stock_minimo;
              const src = imagenSrc(p.imagen_url);
              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border bg-panel shadow-sm transition-all duration-150 ${enCarrito > 0 ? 'border-accent ring-1 ring-accent' : 'border-border'} ${vendible ? 'hover:-translate-y-0.5 hover:border-accent hover:shadow-md' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => agregarAlCarrito(p)}
                    disabled={!vendible || enCarrito >= p.stock}
                    title={
                      estado === 'sin_precio'
                        ? 'Ponle precio en Inventario → Ventas'
                        : estado === 'agotado'
                          ? 'Sin stock'
                          : enCarrito >= p.stock
                            ? 'Ya está todo el stock en el carrito'
                            : 'Agregar al carrito'
                    }
                    className="block w-full text-left active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {/* Fondo claro parejo y foto entera: el catálogo se ve igual aunque las fotos sean distintas. */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                      {src ? (
                        <img
                          src={src}
                          alt={p.nombre}
                          className={`h-full w-full object-contain p-2 transition-transform duration-300 ${vendible ? 'group-hover:scale-105' : 'opacity-50 grayscale'}`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-300">
                          <IconPhoto className="h-9 w-9" />
                        </div>
                      )}

                      {enCarrito > 0 && (
                        <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground shadow">
                          ×{enCarrito}
                        </span>
                      )}
                      {estado === 'agotado' && (
                        <span className="absolute right-2 top-2 rounded-full bg-neutral-800 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">Agotado</span>
                      )}
                      {estado === 'sin_precio' && (
                        <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">Sin precio</span>
                      )}
                      {stockBajo && (
                        <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">Quedan {p.stock}</span>
                      )}
                    </div>

                    <div className="px-3 pt-2.5">
                      <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5">{p.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.Marca?.nombre || 'Sin marca'}</p>
                    </div>
                  </button>

                  <div className="mt-auto flex min-h-[3rem] items-center justify-between gap-2 px-3 pb-3 pt-1.5">
                    {estado === 'sin_precio' ? (
                      <Link href={`/inventario?tab=ventas&buscar=${encodeURIComponent(p.nombre)}`} className="text-xs font-medium text-accent underline-offset-2 hover:underline">
                        Ponerle precio →
                      </Link>
                    ) : (
                      <div className="min-w-0">
                        <p className={`text-base font-bold leading-tight ${vendible ? '' : 'text-muted-foreground'}`}>Bs {Number(p.precio_venta).toFixed(2)}</p>
                        <p className={`text-[11px] ${stockBajo ? 'font-medium text-stat-rose' : 'text-muted-foreground'}`}>
                          {vendible ? `${p.stock} en stock` : 'Sin stock'}
                        </p>
                      </div>
                    )}
                    {enCarrito > 0 && (
                      <div className="flex shrink-0 items-center rounded-lg border border-border">
                        <button type="button" onClick={() => cambiarCantidad(p.id, -1)} aria-label={`Quitar uno de ${p.nombre}`} className="h-7 w-7 rounded-l-lg text-sm hover:bg-accent-soft">
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">{enCarrito}</span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(p.id, 1)}
                          disabled={enCarrito >= p.stock}
                          aria-label={`Agregar uno de ${p.nombre}`}
                          className="h-7 w-7 rounded-r-lg text-sm hover:bg-accent-soft disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {productosFiltrados.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                <IconSearch className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{texto || marca || filtro !== 'todos' ? 'Ningún producto coincide.' : 'Todavía no hay productos para vender.'}</p>
                {(texto || marca || filtro !== 'todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ('');
                      setMarca(null);
                      setFiltro('todos');
                    }}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Ver todos
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fijo al bajar: el total y los botones de cobro siempre a la vista. */}
        <div
          ref={carritoRef}
          className="flex scroll-mt-20 flex-col rounded-lg border border-border bg-panel p-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Carrito</p>
            {carrito.length > 0 && (
              <button type="button" onClick={limpiarVenta} className="text-xs text-muted-foreground hover:text-danger">
                Vaciar
              </button>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
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
            {carrito.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-6 text-center">
                <IconShoppingCart className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">El carrito está vacío</p>
                <p className="text-xs text-muted-foreground">Toca un producto o escanea su código para agregarlo.</p>
              </div>
            )}
          </div>

          <div className="relative mt-3">
            {pacienteSeleccionado ? (
              <div className="flex items-center justify-between gap-2 rounded border border-accent bg-accent-soft px-2.5 py-1.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{pacienteSeleccionado.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">{pacienteSeleccionado.telefono} · suma puntos de fidelidad</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPacienteSeleccionado(null)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder="Buscar paciente o escribir nombre…"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full rounded border border-border px-2.5 py-1.5 text-sm"
                />
                {clienteNombre.trim().length >= 2 && (sugerenciasPacientes.length > 0 || buscandoPaciente) && (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-panel shadow-lg">
                    {buscandoPaciente && <p className="px-3 py-2 text-xs text-muted-foreground">Buscando…</p>}
                    {!buscandoPaciente &&
                      sugerenciasPacientes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPacienteSeleccionado(p);
                            setClienteNombre('');
                            setSugerenciasPacientes([]);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent-soft"
                        >
                          <span className="font-medium">{p.nombre_completo}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{p.telefono}</span>
                        </button>
                      ))}
                    {!buscandoPaciente && sugerenciasPacientes.length === 0 && (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Sin coincidencias — se registrará como &quot;{clienteNombre}&quot; sin vincular a un paciente.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>Bs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="descuento-venta" className="text-muted-foreground">
                Descuento
              </label>
              <div className="flex items-center gap-2">
                {montoDescuento > 0 && <span className="text-xs text-muted-foreground">− Bs {montoDescuento.toFixed(2)}</span>}
                <div className="flex items-center rounded border border-border focus-within:border-accent">
                  <input
                    id="descuento-venta"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="any"
                    placeholder="0"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    className="w-16 [appearance:textfield] bg-transparent px-2 py-1 text-right text-sm outline-none focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="pr-2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            {descuentoInvalido && <p className="text-xs text-danger">El descuento va de 0 a 100 %.</p>}
            <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="text-xl">Bs {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => cobrar('efectivo')}
              disabled={cobrando || carrito.length === 0 || descuentoInvalido}
              className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Efectivo
            </button>
            {modoQR && (
              <button
                onClick={() => cobrar('qr')}
                disabled={cobrando || carrito.length === 0 || descuentoInvalido || !(total > 0)}
                className="flex-1 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cobrando ? 'Procesando…' : 'Cobrar con QR'}
              </button>
            )}
          </div>
          {!modoQR && (
            <p className="mt-2 text-xs text-muted-foreground">Para cobrar con QR, sube el QR de la clínica en Configuración.</p>
          )}
        </div>
      </div>
      )}

      {tab === 'vender' && carrito.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-panel px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] lg:hidden">
          <button
            type="button"
            onClick={() => carritoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex w-full items-center justify-between rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
          >
            <span>
              {carrito.reduce((acc, i) => acc + i.cantidad, 0)} en el carrito · Bs {total.toFixed(2)}
            </span>
            <span>Ir a cobrar</span>
          </button>
        </div>
      )}


      {tab === 'historial' && (
      <div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <input
            type="date"
            value={rango.desde}
            max={rango.hasta}
            onChange={(e) => e.target.value && setRango((r) => ({ desde: e.target.value, hasta: e.target.value > r.hasta ? e.target.value : r.hasta }))}
            className="rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <input
            type="date"
            value={rango.hasta}
            min={rango.desde}
            onChange={(e) => e.target.value && setRango((r) => ({ desde: e.target.value < r.desde ? e.target.value : r.desde, hasta: e.target.value }))}
            className="rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-foreground"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {RANGOS_RAPIDOS.map((r) => {
            const valor = r.calcular();
            const activo = valor.desde === rango.desde && valor.hasta === rango.hasta;
            return (
              <button
                key={r.texto}
                onClick={() => setRango(valor)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${activo ? 'border-accent bg-accent-soft font-medium' : 'border-border hover:bg-accent-soft'}`}
              >
                {r.texto}
              </button>
            );
          })}
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">
            {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
          </p>
          <p className="text-sm font-semibold">Total: Bs {totalDia.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {ventas.map((v, i) => {
          const expandida = ventasExpandidas.has(v.id);
          const nuevoDia = rango.desde !== rango.hasta && v.fecha !== ventas[i - 1]?.fecha;
          const totalDelDia = ventas
            .filter((o) => o.fecha === v.fecha && o.estado === 'pagado')
            .reduce((acc, o) => acc + Number(o.total), 0);
          return (
            <Fragment key={v.id}>
            {nuevoDia && (
              <div className={`flex items-baseline justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${i > 0 ? 'mt-3' : ''}`}>
                <span>{diaLegible(v.fecha)}</span>
                <span>Bs {totalDelDia.toFixed(2)}</span>
              </div>
            )}
            <div className="rounded-lg border border-border bg-panel text-sm">
              <button
                type="button"
                onClick={() => toggleVentaExpandida(v.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{v.VentaItems.map((it) => `${it.cantidad}× ${it.Producto.nombre}`).join(', ')}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {v.Paciente?.nombre_completo || v.cliente_nombre || 'Cliente mostrador'} · {v.Usuario.nombre}
                    {v.estado === 'pendiente' ? ' · Pendiente de pago' : ''}
                    {Number(v.descuento_porcentaje) > 0 ? ` · Descuento ${Number(v.descuento_porcentaje)} %` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-medium">Bs {Number(v.total).toFixed(2)}</span>
                  <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandida ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandida && (
                <div className="border-t border-border px-3 pb-3 pt-2">
                  <div className="flex flex-col gap-1.5">
                    {v.VentaItems.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs text-foreground/80">
                        <span className="min-w-0 flex-1 truncate">{it.Producto.nombre}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {it.cantidad} × Bs {Number(it.precio_unitario).toFixed(2)}
                        </span>
                        <span className="w-20 shrink-0 text-right font-medium">Bs {(it.cantidad * Number(it.precio_unitario)).toFixed(2)}</span>
                      </div>
                    ))}
                    {Number(v.descuento_porcentaje) > 0 && (
                      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 text-xs text-foreground/80">
                        <span className="min-w-0 flex-1">Descuento {Number(v.descuento_porcentaje)} %</span>
                        <span className="w-20 shrink-0 text-right font-medium">− Bs {(Number(v.subtotal) - Number(v.total)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {v.estado === 'pagado' && (
                    <button
                      type="button"
                      onClick={() => imprimir(v.id)}
                      disabled={imprimiendo === v.id}
                      className="mt-3 rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent-soft disabled:opacity-50"
                    >
                      {imprimiendo === v.id ? 'Preparando…' : 'Imprimir comprobante'}
                    </button>
                  )}
                </div>
              )}
            </div>
            </Fragment>
          );
        })}
        {ventas.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <IconShoppingCart className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sin ventas registradas {rango.desde === rango.hasta ? 'este día' : 'en estas fechas'}.</p>
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}
