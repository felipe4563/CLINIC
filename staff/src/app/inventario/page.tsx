'use client';

import { Suspense, useEffect, useMemo, useState, useCallback, FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { validarImagen } from '@/lib/validarImagen';
import ProductoItem, { type Producto } from './ProductoItem';
import ActivoItem, { type Activo } from './ActivoItem';
import PanelEtiquetas, { type Etiqueta } from './PanelEtiquetas';
import { IconSettings } from '@/components/icons';
import { Buscador, Chip, Resultado, Selector, SinResultados, panelFiltros } from './BarraFiltros';
import {
  ESTADO_ACTIVO_LABEL,
  FILTRO_ACTIVOS_VACIO,
  FILTRO_PRODUCTOS_VACIO,
  escribirFiltro,
  filtrarActivos,
  filtrarProductos,
  hayFiltros,
  leerFiltro,
  serviciosDeProductos,
  stockBajo,
  valoresDistintos,
  venceEnTreintaDias,
  type FiltroActivos,
  type FiltroProductos,
} from './filtros';

const VACIO_PRODUCTO = { nombre: '', marcaId: '', categoriaId: '', stock: '0', precio_venta: '' };
const VACIO_ACTIVO = { nombre: '', categoria: '', marca: '', ubicacion: '' };

export default function InventarioPage() {
  return (
    <Suspense>
      <Inventario />
    </Suspense>
  );
}

function Inventario() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: 'productos' | 'activos' = searchParams.get('tab') === 'activos' ? 'activos' : 'productos';
  const filtroProductos = useMemo(() => leerFiltro<FiltroProductos>(searchParams, 'p_', FILTRO_PRODUCTOS_VACIO), [searchParams]);
  const filtroActivos = useMemo(() => leerFiltro<FiltroActivos>(searchParams, 'a_', FILTRO_ACTIVOS_VACIO), [searchParams]);

  // Los filtros viven en la URL: al recargar o compartir el enlace se mantienen.
  function actualizarURL(cambios: { tab?: 'productos' | 'activos'; productos?: FiltroProductos; activos?: FiltroActivos }) {
    const params = new URLSearchParams(searchParams.toString());
    if (cambios.tab) {
      if (cambios.tab === 'activos') params.set('tab', 'activos');
      else params.delete('tab');
    }
    if (cambios.productos) escribirFiltro(params, 'p_', cambios.productos, FILTRO_PRODUCTOS_VACIO);
    if (cambios.activos) escribirFiltro(params, 'a_', cambios.activos, FILTRO_ACTIVOS_VACIO);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const setTab = (t: 'productos' | 'activos') => actualizarURL({ tab: t });
  const setFP = (cambio: Partial<FiltroProductos>) => actualizarURL({ productos: { ...filtroProductos, ...cambio } });
  const setFA = (cambio: Partial<FiltroActivos>) => actualizarURL({ activos: { ...filtroActivos, ...cambio } });

  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Etiqueta[]>([]);
  const [categorias, setCategorias] = useState<Etiqueta[]>([]);
  const [formProductoAbierto, setFormProductoAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState(VACIO_PRODUCTO);
  const [imagenProducto, setImagenProducto] = useState<File | null>(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);

  const [activos, setActivos] = useState<Activo[]>([]);
  const [formActivoAbierto, setFormActivoAbierto] = useState(false);
  const [nuevoActivo, setNuevoActivo] = useState(VACIO_ACTIVO);
  const [imagenActivo, setImagenActivo] = useState<File | null>(null);
  const [guardandoActivo, setGuardandoActivo] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [panelEtiquetasAbierto, setPanelEtiquetasAbierto] = useState(false);
  const cerrarPanelEtiquetas = useCallback(() => setPanelEtiquetasAbierto(false), []);

  const cargar = useCallback(async () => {
    try {
      const [p, a, m, c] = await Promise.all([
        api.getProductos(),
        api.getActivos(),
        api.getMarcas(),
        api.getCategoriasProducto(),
      ]);
      setProductos(p);
      setActivos(a);
      setMarcas(m);
      setCategorias(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceso restringido');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearProducto(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (imagenProducto) {
      const errorImagen = validarImagen(imagenProducto);
      if (errorImagen) {
        setError(errorImagen);
        return;
      }
    }

    setGuardandoProducto(true);
    try {
      const creado = await api.crearProducto({
        nombre: nuevoProducto.nombre,
        marcaId: nuevoProducto.marcaId ? Number(nuevoProducto.marcaId) : null,
        categoriaId: nuevoProducto.categoriaId ? Number(nuevoProducto.categoriaId) : null,
        stock: Number(nuevoProducto.stock),
        precio_venta: Number(nuevoProducto.precio_venta),
      });
      setNuevoProducto(VACIO_PRODUCTO);
      setImagenProducto(null);
      setFormProductoAbierto(false);

      if (imagenProducto) {
        try {
          await api.subirImagenProducto(creado.id, imagenProducto);
        } catch {
          setError('El producto se creó, pero la imagen no se pudo subir. Puedes agregarla editando el producto.');
        }
      }
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto');
    } finally {
      setGuardandoProducto(false);
    }
  }

  async function crearActivo(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (imagenActivo) {
      const errorImagen = validarImagen(imagenActivo);
      if (errorImagen) {
        setError(errorImagen);
        return;
      }
    }

    setGuardandoActivo(true);
    try {
      const creado = await api.crearActivo({
        nombre: nuevoActivo.nombre,
        categoria: nuevoActivo.categoria || null,
        marca: nuevoActivo.marca || null,
        ubicacion: nuevoActivo.ubicacion || null,
      });
      setNuevoActivo(VACIO_ACTIVO);
      setImagenActivo(null);
      setFormActivoAbierto(false);

      if (imagenActivo) {
        try {
          await api.subirImagenActivo(creado.id, imagenActivo);
        } catch {
          setError('El activo se creó, pero la imagen no se pudo subir. Puedes agregarla editando el activo.');
        }
      }
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el activo');
    } finally {
      setGuardandoActivo(false);
    }
  }

  const productosVencenPronto = productos.filter(venceEnTreintaDias).length;
  const productosStockBajo = productos.filter(stockBajo).length;
  const activosOperativos = activos.filter((a) => a.estado === 'operativo').length;

  const productosVisibles = useMemo(() => filtrarProductos(productos, filtroProductos), [productos, filtroProductos]);
  const activosVisibles = useMemo(() => filtrarActivos(activos, filtroActivos), [activos, filtroActivos]);
  const serviciosUsados = useMemo(() => serviciosDeProductos(productos), [productos]);
  // Cuántos productos usan cada marca y categoría (para el panel de gestión).
  const usoMarca = useMemo(() => contarPor(productos, (p) => p.Marca?.id), [productos]);
  const usoCategoria = useMemo(() => contarPor(productos, (p) => p.CategoriaProducto?.id), [productos]);
  const categoriasActivo = useMemo(() => valoresDistintos(activos, 'categoria'), [activos]);
  const ubicacionesActivo = useMemo(() => valoresDistintos(activos, 'ubicacion'), [activos]);
  const hayFiltroProductos = hayFiltros(filtroProductos, FILTRO_PRODUCTOS_VACIO);
  const hayFiltroActivos = hayFiltros(filtroActivos, FILTRO_ACTIVOS_VACIO);
  const limpiarProductos = () => actualizarURL({ productos: { ...FILTRO_PRODUCTOS_VACIO, orden: filtroProductos.orden } });
  const limpiarActivos = () => actualizarURL({ activos: { ...FILTRO_ACTIVOS_VACIO, orden: filtroActivos.orden } });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-lg font-semibold">Inventario</h1>
        <div className="flex flex-wrap gap-2">
          {productosStockBajo > 0 && (
            <button
              type="button"
              onClick={() => actualizarURL({ tab: 'productos', productos: { ...filtroProductos, rapido: 'stock_bajo' } })}
              className="rounded-full bg-stat-rose-soft px-3 py-1 text-xs font-medium text-stat-rose hover:ring-1 hover:ring-stat-rose"
              title="Ver solo los productos con stock bajo"
            >
              {productosStockBajo} con stock bajo
            </button>
          )}
          {productosVencenPronto > 0 && (
            <button
              type="button"
              onClick={() => actualizarURL({ tab: 'productos', productos: { ...filtroProductos, rapido: 'vence' } })}
              className="rounded-full bg-stat-amber-soft px-3 py-1 text-xs font-medium text-stat-amber hover:ring-1 hover:ring-stat-amber"
              title="Ver solo los productos que vencen en 30 días"
            >
              {productosVencenPronto} por vencer
            </button>
          )}
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {activosOperativos} activo(s) operativo(s)
          </span>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          onClick={() => setTab('productos')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'productos' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
        >
          Productos
        </button>
        <button
          onClick={() => setTab('activos')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'activos' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
        >
          Activos de la clínica
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {tab === 'productos' && (
        <div>
          {/* Se monta solo al abrir, para que cada apertura empiece limpia. */}
          {panelEtiquetasAbierto && <PanelEtiquetas
            abierto
            onCerrar={cerrarPanelEtiquetas}
            marcas={marcas}
            categorias={categorias}
            usoMarca={usoMarca}
            usoCategoria={usoCategoria}
            onCrear={async (tipo, nombre) => {
              if (tipo === 'marcas') await api.crearMarca(nombre);
              else await api.crearCategoriaProducto(nombre);
              await cargar();
            }}
            onEliminar={async (tipo, id) => {
              if (tipo === 'marcas') await api.eliminarMarca(id);
              else await api.eliminarCategoriaProducto(id);
              await cargar();
            }}
            onVerProductos={(tipo, id) => {
              setPanelEtiquetasAbierto(false);
              actualizarURL({
                productos: {
                  ...FILTRO_PRODUCTOS_VACIO,
                  orden: filtroProductos.orden,
                  [tipo === 'marcas' ? 'marca' : 'categoria']: String(id),
                },
              });
            }}
          />}

          <div className="mb-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setPanelEtiquetasAbierto(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              <IconSettings className="h-3.5 w-3.5" />
              Marcas y categorías
            </button>
            <button
              onClick={() => setFormProductoAbierto((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formProductoAbierto ? 'Cancelar' : '+ Nuevo producto'}
            </button>
          </div>

          {formProductoAbierto && (
            <form
              onSubmit={crearProducto}
              className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-2 lg:grid-cols-3"
            >
              <input
                placeholder="Nombre"
                required
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <select
                value={nuevoProducto.marcaId}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, marcaId: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              >
                <option value="">Sin marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <select
                value={nuevoProducto.categoriaId}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoriaId: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Stock inicial"
                value={nuevoProducto.stock}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio de venta (Bs)"
                required
                value={nuevoProducto.precio_venta}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <label className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground">
                <span className="shrink-0">Imagen (opcional)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setImagenProducto(e.target.files?.[0] || null)}
                  className="min-w-0 flex-1 text-xs"
                />
              </label>
              <button
                type="submit"
                disabled={guardandoProducto}
                className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-3"
              >
                {guardandoProducto ? 'Creando…' : 'Crear producto'}
              </button>
            </form>
          )}

          {productos.length > 0 && (
            <div className={panelFiltros}>
              <Buscador
                valor={filtroProductos.q}
                onCambiar={(q) => setFP({ q })}
                placeholder="Buscar por nombre, marca o categoría…"
              />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                <Selector
                  etiqueta="Categoría"
                  valor={filtroProductos.categoria}
                  onCambiar={(categoria) => setFP({ categoria })}
                  todos="Todas"
                  opciones={categorias.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
                />
                <Selector
                  etiqueta="Marca"
                  valor={filtroProductos.marca}
                  onCambiar={(marca) => setFP({ marca })}
                  todos="Todas"
                  opciones={marcas.map((m) => ({ valor: String(m.id), texto: m.nombre }))}
                />
                <Selector
                  etiqueta="Usado en servicio"
                  valor={filtroProductos.servicio}
                  onCambiar={(servicio) => setFP({ servicio })}
                  todos="Cualquiera"
                  opciones={serviciosUsados.map((s) => ({ valor: String(s.id), texto: s.nombre }))}
                />
                <Selector
                  etiqueta="Estado"
                  valor={filtroProductos.estado}
                  onCambiar={(estado) => setFP({ estado: estado as FiltroProductos['estado'] })}
                  todos="Todos"
                  opciones={[
                    { valor: 'activos', texto: 'Activos' },
                    { valor: 'inactivos', texto: 'Inactivos' },
                  ]}
                />
                <Selector
                  etiqueta="Ordenar por"
                  valor={filtroProductos.orden}
                  onCambiar={(orden) => setFP({ orden: orden as FiltroProductos['orden'] })}
                  opciones={[
                    { valor: 'nombre', texto: 'Nombre (A–Z)' },
                    { valor: 'stock', texto: 'Stock (menor primero)' },
                    { valor: 'precio', texto: 'Precio (mayor primero)' },
                    { valor: 'categoria', texto: 'Categoría' },
                  ]}
                />
              </div>
              <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3" role="group" aria-label="Filtros rápidos">
                <Chip activo={filtroProductos.rapido === ''} onClick={() => setFP({ rapido: '' })}>
                  Todos {productos.length}
                </Chip>
                <Chip activo={filtroProductos.rapido === 'stock_bajo'} onClick={() => setFP({ rapido: 'stock_bajo' })} tono="rose">
                  Stock bajo {productosStockBajo}
                </Chip>
                <Chip activo={filtroProductos.rapido === 'vence'} onClick={() => setFP({ rapido: 'vence' })} tono="amber">
                  Vence en 30 días {productosVencenPronto}
                </Chip>
              </div>
              <Resultado
                mostrando={productosVisibles.length}
                total={productos.length}
                sustantivo="productos"
                hayFiltros={hayFiltroProductos}
                onLimpiar={limpiarProductos}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {productosVisibles.map((p) => (
              <ProductoItem key={p.id} producto={p} marcas={marcas} categorias={categorias} onChange={cargar} />
            ))}
            {productos.length === 0 && <p className="text-sm text-muted-foreground">No hay productos todavía.</p>}
          </div>
          {productos.length > 0 && productosVisibles.length === 0 && <SinResultados onLimpiar={limpiarProductos} />}
        </div>
      )}

      {tab === 'activos' && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setFormActivoAbierto((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formActivoAbierto ? 'Cancelar' : '+ Nuevo activo'}
            </button>
          </div>

          {formActivoAbierto && (
            <form
              onSubmit={crearActivo}
              className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-2 lg:grid-cols-4"
            >
              <input
                placeholder="Nombre"
                required
                value={nuevoActivo.nombre}
                onChange={(e) => setNuevoActivo({ ...nuevoActivo, nombre: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <input
                placeholder="Categoría (ej. Equipo médico)"
                value={nuevoActivo.categoria}
                onChange={(e) => setNuevoActivo({ ...nuevoActivo, categoria: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <input
                placeholder="Marca"
                value={nuevoActivo.marca}
                onChange={(e) => setNuevoActivo({ ...nuevoActivo, marca: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <input
                placeholder="Ubicación"
                value={nuevoActivo.ubicacion}
                onChange={(e) => setNuevoActivo({ ...nuevoActivo, ubicacion: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              />
              <label className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground">
                <span className="shrink-0">Imagen (opcional)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setImagenActivo(e.target.files?.[0] || null)}
                  className="min-w-0 flex-1 text-xs"
                />
              </label>
              <button
                type="submit"
                disabled={guardandoActivo}
                className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-4"
              >
                {guardandoActivo ? 'Creando…' : 'Crear activo'}
              </button>
            </form>
          )}

          {activos.length > 0 && (
            <div className={panelFiltros}>
              <Buscador
                valor={filtroActivos.q}
                onCambiar={(q) => setFA({ q })}
                placeholder="Nombre, marca, modelo o n.º de serie…"
              />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Selector
                  etiqueta="Categoría"
                  valor={filtroActivos.categoria}
                  onCambiar={(categoria) => setFA({ categoria })}
                  todos="Todas"
                  opciones={categoriasActivo.map((c) => ({ valor: c, texto: c }))}
                />
                <Selector
                  etiqueta="Ubicación"
                  valor={filtroActivos.ubicacion}
                  onCambiar={(ubicacion) => setFA({ ubicacion })}
                  todos="Todas"
                  opciones={ubicacionesActivo.map((u) => ({ valor: u, texto: u }))}
                />
                <Selector
                  etiqueta="Estado"
                  valor={filtroActivos.estado}
                  onCambiar={(estado) => setFA({ estado: estado as FiltroActivos['estado'] })}
                  todos="Todos"
                  opciones={(Object.keys(ESTADO_ACTIVO_LABEL) as (keyof typeof ESTADO_ACTIVO_LABEL)[]).map((e) => ({
                    valor: e,
                    texto: `${ESTADO_ACTIVO_LABEL[e]} (${activos.filter((a) => a.estado === e).length})`,
                  }))}
                />
                <Selector
                  etiqueta="Ordenar por"
                  valor={filtroActivos.orden}
                  onCambiar={(orden) => setFA({ orden: orden as FiltroActivos['orden'] })}
                  opciones={[
                    { valor: 'nombre', texto: 'Nombre (A–Z)' },
                    { valor: 'valor', texto: 'Valor (mayor primero)' },
                    { valor: 'ubicacion', texto: 'Ubicación' },
                  ]}
                />
              </div>
              <Resultado
                mostrando={activosVisibles.length}
                total={activos.length}
                sustantivo="activos"
                hayFiltros={hayFiltroActivos}
                onLimpiar={limpiarActivos}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {activosVisibles.map((a) => (
              <ActivoItem key={a.id} activo={a} onChange={cargar} />
            ))}
            {activos.length === 0 && <p className="text-sm text-muted-foreground">No hay activos registrados todavía.</p>}
          </div>
          {activos.length > 0 && activosVisibles.length === 0 && <SinResultados onLimpiar={limpiarActivos} />}
        </div>
      )}
    </div>
  );
}

function contarPor<T>(lista: T[], clave: (x: T) => number | undefined) {
  const mapa = new Map<number, number>();
  for (const x of lista) {
    const k = clave(x);
    if (k !== undefined) mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return mapa;
}
