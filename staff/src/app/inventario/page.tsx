'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';
import ProductoItem, { type Producto } from './ProductoItem';
import ActivoItem, { type Activo } from './ActivoItem';
import EtiquetaManager, { type Etiqueta } from './EtiquetaManager';

const VACIO_PRODUCTO = { nombre: '', marcaId: '', categoriaId: '', stock: '0', precio_venta: '', fecha_vencimiento: '' };
const VACIO_ACTIVO = { nombre: '', categoria: '', marca: '', ubicacion: '' };

export default function InventarioPage() {
  const [tab, setTab] = useState<'productos' | 'activos'>('productos');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Etiqueta[]>([]);
  const [categorias, setCategorias] = useState<Etiqueta[]>([]);
  const [formProductoAbierto, setFormProductoAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState(VACIO_PRODUCTO);
  const [guardandoProducto, setGuardandoProducto] = useState(false);

  const [activos, setActivos] = useState<Activo[]>([]);
  const [formActivoAbierto, setFormActivoAbierto] = useState(false);
  const [nuevoActivo, setNuevoActivo] = useState(VACIO_ACTIVO);
  const [guardandoActivo, setGuardandoActivo] = useState(false);

  const [error, setError] = useState<string | null>(null);

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
    setGuardandoProducto(true);
    setError(null);
    try {
      await api.crearProducto({
        nombre: nuevoProducto.nombre,
        marcaId: nuevoProducto.marcaId ? Number(nuevoProducto.marcaId) : null,
        categoriaId: nuevoProducto.categoriaId ? Number(nuevoProducto.categoriaId) : null,
        stock: Number(nuevoProducto.stock),
        precio_venta: Number(nuevoProducto.precio_venta),
        fecha_vencimiento: nuevoProducto.fecha_vencimiento || null,
      });
      setNuevoProducto(VACIO_PRODUCTO);
      setFormProductoAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto');
    } finally {
      setGuardandoProducto(false);
    }
  }

  async function crearActivo(e: FormEvent) {
    e.preventDefault();
    setGuardandoActivo(true);
    setError(null);
    try {
      await api.crearActivo({
        nombre: nuevoActivo.nombre,
        categoria: nuevoActivo.categoria || null,
        marca: nuevoActivo.marca || null,
        ubicacion: nuevoActivo.ubicacion || null,
      });
      setNuevoActivo(VACIO_ACTIVO);
      setFormActivoAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el activo');
    } finally {
      setGuardandoActivo(false);
    }
  }

  const productosVencenPronto = productos.filter((p) => {
    if (!p.fecha_vencimiento) return false;
    const dias = Math.round((new Date(p.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias <= 30;
  }).length;
  const productosStockBajo = productos.filter((p) => p.stock <= p.stock_minimo).length;
  const activosOperativos = activos.filter((a) => a.estado === 'operativo').length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-lg font-semibold">Inventario</h1>
        <div className="flex flex-wrap gap-2">
          {productosStockBajo > 0 && (
            <span className="rounded-full bg-stat-rose-soft px-3 py-1 text-xs font-medium text-stat-rose">
              {productosStockBajo} con stock bajo
            </span>
          )}
          {productosVencenPronto > 0 && (
            <span className="rounded-full bg-stat-amber-soft px-3 py-1 text-xs font-medium text-stat-amber">
              {productosVencenPronto} por vencer
            </span>
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
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <EtiquetaManager
              titulo="Marcas"
              etiquetas={marcas}
              onCrear={async (nombre) => {
                await api.crearMarca(nombre);
                cargar();
              }}
              onEliminar={async (id) => {
                await api.eliminarMarca(id);
                cargar();
              }}
            />
            <EtiquetaManager
              titulo="Categorías"
              etiquetas={categorias}
              onCrear={async (nombre) => {
                await api.crearCategoriaProducto(nombre);
                cargar();
              }}
              onEliminar={async (id) => {
                await api.eliminarCategoriaProducto(id);
                cargar();
              }}
            />
          </div>

          <div className="mb-3 flex justify-end">
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
              <input
                type="date"
                value={nuevoProducto.fecha_vencimiento}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, fecha_vencimiento: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
                title="Fecha de vencimiento (opcional)"
              />
              <button
                type="submit"
                disabled={guardandoProducto}
                className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-3"
              >
                {guardandoProducto ? 'Creando…' : 'Crear producto'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {productos.map((p) => (
              <ProductoItem key={p.id} producto={p} marcas={marcas} categorias={categorias} onChange={cargar} />
            ))}
            {productos.length === 0 && <p className="text-sm text-muted-foreground">No hay productos todavía.</p>}
          </div>
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
              <button
                type="submit"
                disabled={guardandoActivo}
                className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-4"
              >
                {guardandoActivo ? 'Creando…' : 'Crear activo'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {activos.map((a) => (
              <ActivoItem key={a.id} activo={a} onChange={cargar} />
            ))}
            {activos.length === 0 && <p className="text-sm text-muted-foreground">No hay activos registrados todavía.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
