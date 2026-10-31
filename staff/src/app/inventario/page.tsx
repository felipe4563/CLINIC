'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import InventarioPorLugar from './InventarioPorLugar';
import MantenimientoEquipos from './MantenimientoEquipos';
import ProductosCaja, { CAJAS, seAcaba, type Acapite, type ProductoVenta } from './ProductosCaja';

// Inventario: arriba las 3 cajas de productos (insumos, activos y ventas), con un
// total por producto; debajo el material de cada lugar y el mantenimiento de equipos.
// La pestaña va en la dirección (?tab=…) para volver a ella al recargar.
type Pestana = Acapite | 'lugar' | 'mantenimiento';
const PESTANAS: { clave: Pestana; texto: string }[] = [
  { clave: 'insumos', texto: 'Insumos' },
  { clave: 'activos', texto: 'Activos' },
  { clave: 'ventas', texto: 'Ventas' },
  { clave: 'lugar', texto: 'Por lugar' },
  { clave: 'mantenimiento', texto: 'Mantenimiento' },
];
const CLAVES_CAJA: Acapite[] = ['insumos', 'activos', 'ventas'];

export default function InventarioPage() {
  return (
    <Suspense>
      <Inventario />
    </Suspense>
  );
}

function Inventario() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pedida = searchParams.get('tab');
  const tab: Pestana = PESTANAS.some((p) => p.clave === pedida) ? (pedida as Pestana) : 'insumos';

  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(
    () =>
      api
        .getProductosVenta()
        .then((lista: ProductoVenta[]) => {
          setProductos(lista);
          setError('');
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos')),
    [],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function cambiarTab(nueva: Pestana) {
    const params = new URLSearchParams(searchParams.toString());
    if (nueva === 'insumos') params.delete('tab');
    else params.set('tab', nueva);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Inventario</h1>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CLAVES_CAJA.map((clave) => {
          const deLaCaja = productos.filter((p) => p.acapite === clave && p.activo);
          const acaban = deLaCaja.filter(seAcaba).length;
          const activa = tab === clave;
          return (
            <button
              key={clave}
              type="button"
              onClick={() => cambiarTab(clave)}
              aria-pressed={activa}
              className={`rounded-xl border bg-panel p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${activa ? 'border-accent ring-1 ring-accent' : 'border-border'}`}
            >
              <p className="text-sm font-semibold">{CAJAS[clave].titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{CAJAS[clave].descripcion}</p>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-semibold tabular-nums">{deLaCaja.length}</span>
                <span className="text-xs text-muted-foreground">producto{deLaCaja.length === 1 ? '' : 's'}</span>
                {acaban > 0 && (
                  <span className="rounded-full bg-stat-rose-soft px-2 py-0.5 text-xs text-stat-rose">
                    {acaban} se {acaban === 1 ? 'acaba' : 'acaban'}
                  </span>
                )}
              </p>
            </button>
          );
        })}
      </div>

      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {PESTANAS.map((p) => (
          <button
            key={p.clave}
            role="tab"
            aria-selected={tab === p.clave}
            onClick={() => cambiarTab(p.clave)}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium ${tab === p.clave ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {(tab === 'insumos' || tab === 'activos' || tab === 'ventas') && <ProductosCaja acapite={tab} productos={productos} onCambio={cargar} />}
      {tab === 'lugar' && <InventarioPorLugar />}
      {tab === 'mantenimiento' && <MantenimientoEquipos />}
    </div>
  );
}
