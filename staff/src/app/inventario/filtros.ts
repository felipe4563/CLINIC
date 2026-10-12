import type { Producto } from './ProductoItem';
import type { Activo } from './ActivoItem';

// Minúsculas y sin acentos, para que "acido" encuentre "Ácido".
export function normalizar(texto: string | null | undefined) {
  return (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function coincide(busqueda: string, campos: (string | null | undefined)[]) {
  const q = normalizar(busqueda);
  if (!q) return true;
  return campos.some((c) => normalizar(c).includes(q));
}

export function venceEnTreintaDias(p: Producto) {
  if (!p.proximo_vencimiento) return false;
  const dias = Math.round((new Date(p.proximo_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return dias <= 30;
}

export function stockBajo(p: Producto) {
  return p.stock <= p.stock_minimo;
}

// ---------------------------------------------------------------- productos

export type FiltroProductos = {
  q: string;
  categoria: string; // id o ''
  marca: string; // id o ''
  servicio: string; // id o ''
  estado: '' | 'activos' | 'inactivos';
  rapido: '' | 'stock_bajo' | 'vence';
  orden: 'nombre' | 'stock' | 'precio' | 'categoria';
};

export const FILTRO_PRODUCTOS_VACIO: FiltroProductos = {
  q: '',
  categoria: '',
  marca: '',
  servicio: '',
  estado: '',
  rapido: '',
  orden: 'nombre',
};

export function filtrarProductos(productos: Producto[], f: FiltroProductos) {
  const lista = productos.filter((p) => {
    if (!coincide(f.q, [p.nombre, p.Marca?.nombre, p.CategoriaProducto?.nombre])) return false;
    if (f.categoria && String(p.CategoriaProducto?.id ?? '') !== f.categoria) return false;
    if (f.marca && String(p.Marca?.id ?? '') !== f.marca) return false;
    if (f.servicio && !(p.Servicios ?? []).some((s) => String(s.id) === f.servicio)) return false;
    if (f.estado === 'activos' && !p.activo) return false;
    if (f.estado === 'inactivos' && p.activo) return false;
    if (f.rapido === 'stock_bajo' && !stockBajo(p)) return false;
    if (f.rapido === 'vence' && !venceEnTreintaDias(p)) return false;
    return true;
  });

  const porNombre = (a: Producto, b: Producto) => a.nombre.localeCompare(b.nombre, 'es');
  const comparar: Record<FiltroProductos['orden'], (a: Producto, b: Producto) => number> = {
    nombre: porNombre,
    stock: (a, b) => a.stock - b.stock || porNombre(a, b),
    precio: (a, b) => Number(b.precio_venta) - Number(a.precio_venta) || porNombre(a, b),
    categoria: (a, b) =>
      (a.CategoriaProducto?.nombre ?? '~').localeCompare(b.CategoriaProducto?.nombre ?? '~', 'es') || porNombre(a, b),
  };
  return [...lista].sort(comparar[f.orden]);
}

// Servicios distintos que aparecen como uso de algún producto, para el desplegable.
export function serviciosDeProductos(productos: Producto[]) {
  const mapa = new Map<number, string>();
  for (const p of productos) for (const s of p.Servicios ?? []) mapa.set(s.id, s.nombre);
  return [...mapa].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// ---------------------------------------------------------------- activos

export type FiltroActivos = {
  q: string;
  categoria: string; // texto o ''
  ubicacion: string; // texto o ''
  estado: '' | Activo['estado'];
  orden: 'nombre' | 'valor' | 'ubicacion';
};

export const FILTRO_ACTIVOS_VACIO: FiltroActivos = { q: '', categoria: '', ubicacion: '', estado: '', orden: 'nombre' };

export const ESTADO_ACTIVO_LABEL: Record<Activo['estado'], string> = {
  operativo: 'Operativo',
  mantenimiento: 'En mantenimiento',
  dado_de_baja: 'Dado de baja',
};

export function filtrarActivos(activos: Activo[], f: FiltroActivos) {
  const lista = activos.filter((a) => {
    if (!coincide(f.q, [a.nombre, a.marca, a.modelo, a.numero_serie, a.categoria, a.ubicacion])) return false;
    if (f.categoria && (a.categoria ?? '') !== f.categoria) return false;
    if (f.ubicacion && (a.ubicacion ?? '') !== f.ubicacion) return false;
    if (f.estado && a.estado !== f.estado) return false;
    return true;
  });

  const porNombre = (a: Activo, b: Activo) => a.nombre.localeCompare(b.nombre, 'es');
  const comparar: Record<FiltroActivos['orden'], (a: Activo, b: Activo) => number> = {
    nombre: porNombre,
    valor: (a, b) => Number(b.valor_adquisicion ?? 0) - Number(a.valor_adquisicion ?? 0) || porNombre(a, b),
    ubicacion: (a, b) => (a.ubicacion ?? '~').localeCompare(b.ubicacion ?? '~', 'es') || porNombre(a, b),
  };
  return [...lista].sort(comparar[f.orden]);
}

export function valoresDistintos(activos: Activo[], campo: 'categoria' | 'ubicacion') {
  return [...new Set(activos.map((a) => a[campo]).filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b, 'es'));
}

// ---------------------------------------------------------------- URL
// Cada filtro vive en la URL con un prefijo propio (p_ productos, a_ activos)
// para que al recargar o compartir el enlace se mantenga.

export function leerFiltro<T extends Record<string, string>>(params: URLSearchParams, prefijo: string, vacio: T): T {
  const r = { ...vacio };
  for (const k of Object.keys(vacio) as (keyof T & string)[]) {
    const v = params.get(prefijo + k);
    if (v !== null) r[k] = v as T[typeof k];
  }
  return r;
}

export function escribirFiltro<T extends Record<string, string>>(params: URLSearchParams, prefijo: string, filtro: T, vacio: T) {
  for (const k of Object.keys(vacio)) {
    if (filtro[k] && filtro[k] !== vacio[k]) params.set(prefijo + k, filtro[k]);
    else params.delete(prefijo + k);
  }
}

export function hayFiltros<T extends Record<string, string>>(filtro: T, vacio: T) {
  return Object.keys(vacio).some((k) => k !== 'orden' && filtro[k] !== vacio[k]);
}
