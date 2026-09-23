'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Etiqueta } from './EtiquetaManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export type Producto = {
  id: number;
  nombre: string;
  Marca: Etiqueta | null;
  CategoriaProducto: Etiqueta | null;
  unidad: string;
  stock: number;
  stock_minimo: number;
  precio_venta: string;
  precio_costo: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
  imagen_url: string | null;
  activo: boolean;
};

function imagenSrc(imagenUrl: string | null) {
  if (!imagenUrl) return null;
  return imagenUrl.startsWith('/uploads/') ? `${API_URL}${imagenUrl}` : imagenUrl;
}

function diasParaVencer(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [a, m, d] = fecha.split('-').map(Number);
  const venc = new Date(a, m - 1, d);
  return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export default function ProductoItem({
  producto,
  marcas,
  categorias,
  onChange,
}: {
  producto: Producto;
  marcas: Etiqueta[];
  categorias: Etiqueta[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(producto.nombre);
  const [marcaId, setMarcaId] = useState(producto.Marca?.id ? String(producto.Marca.id) : '');
  const [categoriaId, setCategoriaId] = useState(producto.CategoriaProducto?.id ? String(producto.CategoriaProducto.id) : '');
  const [stock, setStock] = useState(String(producto.stock));
  const [stockMinimo, setStockMinimo] = useState(String(producto.stock_minimo));
  const [precioVenta, setPrecioVenta] = useState(producto.precio_venta);
  const [lote, setLote] = useState(producto.lote || '');
  const [fechaVencimiento, setFechaVencimiento] = useState(producto.fecha_vencimiento || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const inputImagenRef = useRef<HTMLInputElement>(null);

  async function seleccionarImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoImagen(true);
    setError('');
    try {
      await api.subirImagenProducto(producto.id, archivo);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setSubiendoImagen(false);
      if (inputImagenRef.current) inputImagenRef.current.value = '';
    }
  }

  async function quitarImagen() {
    setSubiendoImagen(true);
    setError('');
    try {
      await api.eliminarImagenProducto(producto.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  }

  function empezarEdicion() {
    setNombre(producto.nombre);
    setMarcaId(producto.Marca?.id ? String(producto.Marca.id) : '');
    setCategoriaId(producto.CategoriaProducto?.id ? String(producto.CategoriaProducto.id) : '');
    setStock(String(producto.stock));
    setStockMinimo(String(producto.stock_minimo));
    setPrecioVenta(producto.precio_venta);
    setLote(producto.lote || '');
    setFechaVencimiento(producto.fecha_vencimiento || '');
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarProducto(producto.id, {
        nombre,
        marcaId: marcaId ? Number(marcaId) : null,
        categoriaId: categoriaId ? Number(categoriaId) : null,
        stock: Number(stock),
        stock_minimo: Number(stockMinimo),
        precio_venta: Number(precioVenta),
        lote: lote || null,
        fecha_vencimiento: fechaVencimiento || null,
      });
      setEditando(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo() {
    await api.actualizarProducto(producto.id, { activo: !producto.activo });
    onChange();
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-3 text-sm">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
            {imagenSrc(producto.imagen_url) ? (
              <img src={imagenSrc(producto.imagen_url)!} alt={producto.nombre} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-muted-foreground">Sin imagen</span>
            )}
          </div>
          <div className="flex gap-2">
            <input ref={inputImagenRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={seleccionarImagen} className="hidden" />
            <button
              type="button"
              onClick={() => inputImagenRef.current?.click()}
              disabled={subiendoImagen}
              className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft disabled:opacity-50"
            >
              {subiendoImagen ? 'Subiendo…' : producto.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            {producto.imagen_url && (
              <button type="button" onClick={quitarImagen} disabled={subiendoImagen} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft disabled:opacity-50">
                Quitar
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded border border-border px-2 py-1.5" />
          <input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Lote (opcional)" className="rounded border border-border px-2 py-1.5" />
          <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} className="rounded border border-border px-2 py-1.5">
            <option value="">Sin marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="rounded border border-border px-2 py-1.5">
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="rounded border border-border px-2 py-1.5"
          />
          <input
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            placeholder="Stock mínimo"
            className="rounded border border-border px-2 py-1.5"
          />
          <input
            type="number"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            placeholder="Precio de venta (Bs)"
            className="rounded border border-border px-2 py-1.5"
          />
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            className="rounded border border-border px-2 py-1.5"
          />
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={guardar}
            disabled={guardando}
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button onClick={() => setEditando(false)} className="rounded border border-border px-3 py-1.5 text-xs">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const dias = producto.fecha_vencimiento ? diasParaVencer(producto.fecha_vencimiento) : null;
  const stockBajo = producto.stock <= producto.stock_minimo;

  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-lg border border-border bg-panel p-3 text-sm">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
            {imagenSrc(producto.imagen_url) ? (
              <img src={imagenSrc(producto.imagen_url)!} alt={producto.nombre} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[9px] text-muted-foreground">Sin foto</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate font-medium">{producto.nombre}</p>
              <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">Bs {producto.precio_venta}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {producto.Marca ? `${producto.Marca.nombre} · ` : ''}
              {producto.CategoriaProducto?.nombre || 'Sin categoría'}
            </p>
          </div>
        </div>
        <p className={`mt-1.5 text-xs font-medium ${stockBajo ? 'text-danger' : 'text-foreground/70'}`}>
          Stock: {producto.stock} {producto.unidad}
          {stockBajo ? ' · Stock bajo' : ''}
        </p>
        {producto.fecha_vencimiento && dias !== null && (
          <p className={`mt-1 text-xs ${dias < 0 ? 'text-danger' : dias <= 30 ? 'text-stat-amber' : 'text-muted-foreground'}`}>
            {dias < 0 ? `Venció el ${fmtFecha(producto.fecha_vencimiento)}` : `Vence el ${fmtFecha(producto.fecha_vencimiento)} (${dias} días)`}
          </p>
        )}
        {!producto.activo && <span className="mt-2 inline-block rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground">Inactivo</span>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
          Editar
        </button>
        <button onClick={toggleActivo} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
          {producto.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
