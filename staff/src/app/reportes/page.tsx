'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { IconBarChart, IconBox, IconCalendar, IconChevronDown, IconDownload, IconTruck, IconUsers, IconWallet } from '@/components/icons';
import ReportePersonal, { type Personal } from './ReportePersonal';

type Financiero = {
  totalIngresos: number;
  totalEgresos: number;
  neto: number;
  porDia: { fecha: string; ingresos: number; egresos: number }[];
};

type Citas = {
  total: number;
  noShowRate: number;
  porEstado: Record<string, number>;
  porProfesional: { profesional: string; cantidad: number }[];
  porServicio: { servicio: string; cantidad: number }[];
};

type Pacientes = {
  pacientesNuevos: number;
  pacientesConCita: number;
  pacientesRecurrentes: number;
  saldosPendientes: { paciente: string; monto: number }[];
  totalSaldoPendiente: number;
};

type Ventas = {
  totalVentas: number;
  cantidadVentas: number;
  topProductos: { producto: string; cantidad: number; subtotal: number }[];
  stockBajo: { producto: string; stock: number; stockMinimo: number }[];
  valorizacionInventario: number;
};

type Compras = {
  totalCompras: number;
  cantidadCompras: number;
  porProveedor: { proveedor: string; cantidad: number; total: number }[];
  topProductos: { producto: string; cantidad: number; subtotal: number }[];
};

const TABS = [
  { key: 'financiero', label: 'Financiero', icon: IconWallet },
  { key: 'citas-pacientes', label: 'Citas y Pacientes', icon: IconCalendar },
  { key: 'ventas', label: 'Ventas e Inventario', icon: IconBox },
  { key: 'compras', label: 'Compras', icon: IconTruck },
  { key: 'personal', label: 'Personal', icon: IconUsers },
] as const;

type Tab = (typeof TABS)[number]['key'];

const PDFS: Record<Tab, { tipo: string; label: string }[]> = {
  financiero: [{ tipo: 'financiero', label: 'Reporte financiero' }],
  'citas-pacientes': [
    { tipo: 'citas', label: 'Reporte de citas' },
    { tipo: 'pacientes', label: 'Reporte de pacientes' },
  ],
  ventas: [{ tipo: 'ventas', label: 'Reporte de ventas' }],
  compras: [{ tipo: 'compras', label: 'Reporte de compras' }],
  personal: [{ tipo: 'personal', label: 'Reporte de personal' }],
};

function esTab(valor: string | null): valor is Tab {
  return TABS.some((t) => t.key === valor);
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

function moneda(n: number) {
  return `Bs ${n.toFixed(2)}`;
}

function aISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mes-anterior', label: 'Mes anterior' },
] as const;

type Periodo = (typeof PERIODOS)[number]['key'];

function rangoDe(periodo: Periodo) {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  if (periodo === 'hoy') return { desde: aISO(hoy), hasta: aISO(hoy) };
  if (periodo === '7d') return { desde: aISO(new Date(y, m, hoy.getDate() - 6)), hasta: aISO(hoy) };
  if (periodo === 'mes') return { desde: aISO(new Date(y, m, 1)), hasta: aISO(hoy) };
  return { desde: aISO(new Date(y, m - 1, 1)), hasta: aISO(new Date(y, m, 0)) };
}

export default function ReportesPage() {
  return (
    <Suspense>
      <Reportes />
    </Suspense>
  );
}

function Reportes() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get('tab');
  const tab: Tab = esTab(paramTab) ? paramTab : 'financiero';

  const [periodo, setPeriodo] = useState<Periodo | null>('mes');
  const [desde, setDesde] = useState(() => rangoDe('mes').desde);
  const [hasta, setHasta] = useState(() => rangoDe('mes').hasta);
  const rangoInvalido = desde > hasta;

  const [financiero, setFinanciero] = useState<Financiero | null>(null);
  const [citas, setCitas] = useState<Citas | null>(null);
  const [pacientes, setPacientes] = useState<Pacientes | null>(null);
  const [ventas, setVentas] = useState<Ventas | null>(null);
  const [compras, setCompras] = useState<Compras | null>(null);
  const [personal, setPersonal] = useState<Personal | null>(null);

  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (rangoInvalido) return;
    setCargando(true);
    setError(null);
    try {
      const params = { desde, hasta };
      if (tab === 'financiero') setFinanciero(await api.getReporte('financiero', params));
      if (tab === 'citas-pacientes') {
        const [c, p] = await Promise.all([api.getReporte('citas', params), api.getReporte('pacientes', params)]);
        setCitas(c);
        setPacientes(p);
      }
      if (tab === 'ventas') setVentas(await api.getReporte('ventas', params));
      if (tab === 'compras') setCompras(await api.getReporte('compras', params));
      if (tab === 'personal') setPersonal(await api.getReporte('personal', params));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
    } finally {
      setCargando(false);
    }
  }, [tab, desde, hasta, rangoInvalido]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiarTab(nuevo: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nuevo);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function elegirPeriodo(p: Periodo) {
    const r = rangoDe(p);
    setPeriodo(p);
    setDesde(r.desde);
    setHasta(r.hasta);
  }

  async function descargarPDF(tipo: string) {
    setDescargando(true);
    setError(null);
    try {
      await api.descargarReportePDF(tipo, { desde, hasta });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el PDF');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <IconBarChart className="h-5 w-5 text-muted-foreground" />
            Reportes
          </h1>
          <p className="text-sm text-muted-foreground">Resumen operativo de la clínica, exportable en PDF.</p>
        </div>
        <BotonPDF opciones={PDFS[tab]} descargando={descargando} deshabilitado={rangoInvalido} onDescargar={descargarPDF} />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 lg:mx-0 lg:px-0" role="group" aria-label="Periodo rápido">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => elegirPeriodo(p.key)}
              aria-pressed={periodo === p.key}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === p.key
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent-soft hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-3">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:items-center lg:gap-2">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => {
                setDesde(e.target.value);
                setPeriodo(null);
              }}
              aria-invalid={rangoInvalido}
              className={`w-full min-w-0 rounded-lg border bg-background lg:w-44 px-2.5 py-1.5 text-sm text-foreground ${rangoInvalido ? 'border-danger' : 'border-border'}`}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:items-center lg:gap-2">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => {
                setHasta(e.target.value);
                setPeriodo(null);
              }}
              aria-invalid={rangoInvalido}
              className={`w-full min-w-0 rounded-lg border bg-background lg:w-44 px-2.5 py-1.5 text-sm text-foreground ${rangoInvalido ? 'border-danger' : 'border-border'}`}
            />
          </label>
        </div>
      </div>

      <Pestanas activa={tab} onCambiar={cambiarTab} />

      {rangoInvalido && <p className="mb-3 text-sm text-danger">La fecha «Desde» no puede ser posterior a «Hasta».</p>}
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {cargando && !rangoInvalido && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!cargando && !rangoInvalido && tab === 'financiero' && financiero && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card label="Ingresos" valor={moneda(financiero.totalIngresos)} />
            <Card label="Egresos" valor={moneda(financiero.totalEgresos)} />
            <Card label="Saldo neto" valor={moneda(financiero.neto)} />
          </div>
          <Tabla
            columnas={['Fecha', 'Ingresos', 'Egresos', 'Neto']}
            filas={financiero.porDia.map((d) => [d.fecha, moneda(d.ingresos), moneda(d.egresos), moneda(d.ingresos - d.egresos)])}
            vacio="Sin movimientos de caja en este periodo."
          />
        </div>
      )}

      {!cargando && !rangoInvalido && tab === 'citas-pacientes' && citas && pacientes && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Card label="Total citas" valor={String(citas.total)} />
            <Card label="Tasa de inasistencia" valor={`${citas.noShowRate.toFixed(1)}%`} />
            <Card label="Pacientes nuevos" valor={String(pacientes.pacientesNuevos)} />
            <Card label="Saldos pendientes" valor={moneda(pacientes.totalSaldoPendiente)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">Citas por profesional</p>
              <Tabla columnas={['Profesional', 'Citas']} filas={citas.porProfesional.map((p) => [p.profesional, p.cantidad])} vacio="Sin citas." />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Citas por servicio</p>
              <Tabla columnas={['Servicio', 'Citas']} filas={citas.porServicio.map((s) => [s.servicio, s.cantidad])} vacio="Sin citas." />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Citas por estado</p>
            <Tabla
              columnas={['Estado', 'Cantidad']}
              filas={Object.entries(citas.porEstado).map(([e, c]) => [ESTADO_LABEL[e] ?? e, c])}
              vacio="Sin citas."
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Saldos pendientes por paciente</p>
            <Tabla
              columnas={['Paciente', 'Saldo']}
              filas={pacientes.saldosPendientes.map((s) => [s.paciente, moneda(s.monto)])}
              vacio="No hay saldos pendientes."
            />
          </div>
        </div>
      )}

      {!cargando && !rangoInvalido && tab === 'ventas' && ventas && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card label="Total vendido" valor={moneda(ventas.totalVentas)} />
            <Card label="Cantidad de ventas" valor={String(ventas.cantidadVentas)} />
            <Card label="Valorización inventario" valor={moneda(ventas.valorizacionInventario)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Productos más vendidos</p>
            <Tabla
              columnas={['Producto', 'Cantidad', 'Subtotal']}
              filas={ventas.topProductos.map((p) => [p.producto, p.cantidad, moneda(p.subtotal)])}
              vacio="Sin ventas en este periodo."
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Stock bajo</p>
            <Tabla
              columnas={['Producto', 'Stock', 'Stock mínimo']}
              filas={ventas.stockBajo.map((p) => [p.producto, p.stock, p.stockMinimo])}
              vacio="Ningún producto con stock bajo."
            />
          </div>
        </div>
      )}

      {!cargando && !rangoInvalido && tab === 'compras' && compras && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card label="Total comprado" valor={moneda(compras.totalCompras)} />
            <Card label="Cantidad de compras" valor={String(compras.cantidadCompras)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Gasto por proveedor</p>
            <Tabla
              columnas={['Proveedor', 'Compras', 'Total']}
              filas={compras.porProveedor.map((p) => [p.proveedor, p.cantidad, moneda(p.total)])}
              vacio="Sin compras en este periodo."
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Productos más comprados</p>
            <Tabla
              columnas={['Producto', 'Cantidad', 'Subtotal']}
              filas={compras.topProductos.map((p) => [p.producto, p.cantidad, moneda(p.subtotal)])}
              vacio="Sin compras en este periodo."
            />
          </div>
        </div>
      )}

      {!cargando && !rangoInvalido && tab === 'personal' && personal && (
        <div className="flex flex-col gap-4">
          <ReportePersonal datos={personal} />
        </div>
      )}
    </div>
  );
}

function BotonPDF({
  opciones,
  descargando,
  deshabilitado,
  onDescargar,
}: {
  opciones: { tipo: string; label: string }[];
  descargando: boolean;
  deshabilitado: boolean;
  onDescargar: (tipo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function cerrar(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', cerrar);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', cerrar);
    };
  }, [abierto]);

  const varias = opciones.length > 1;
  const clases =
    'flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-medium hover:bg-accent-soft disabled:opacity-60';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={descargando || deshabilitado}
        onClick={() => (varias ? setAbierto((v) => !v) : onDescargar(opciones[0].tipo))}
        aria-haspopup={varias ? 'menu' : undefined}
        aria-expanded={varias ? abierto : undefined}
        className={clases}
      >
        <IconDownload className="h-4 w-4" />
        {descargando ? (
          <span>Generando…</span>
        ) : (
          <span>
            <span className="hidden sm:inline">Descargar </span>PDF
          </span>
        )}
        {varias && <IconChevronDown className="h-3.5 w-3.5" />}
      </button>
      {varias && abierto && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-panel py-1 shadow-lg">
          {opciones.map((o) => (
            <button
              key={o.tipo}
              type="button"
              role="menuitem"
              onClick={() => {
                setAbierto(false);
                onDescargar(o.tipo);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-accent-soft"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Pestanas({ activa, onCambiar }: { activa: Tab; onCambiar: (t: Tab) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ izq: false, der: false });

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setBordes({ izq: el.scrollLeft > 4, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [medir]);

  // La pestaña activa siempre queda visible (y centrada) en pantallas angostas.
  // Se calcula a mano en vez de scrollIntoView para no mover el scroll vertical de la página.
  const primeraVez = useRef(true);
  useEffect(() => {
    const el = ref.current;
    const boton = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el || !boton) return;
    const rEl = el.getBoundingClientRect();
    const rBoton = boton.getBoundingClientRect();
    const left = el.scrollLeft + (rBoton.left - rEl.left) - (el.clientWidth - rBoton.width) / 2;
    el.scrollTo({ left, behavior: primeraVez.current ? 'instant' : 'smooth' });
    primeraVez.current = false;
  }, [activa]);

  const mascara = [bordes.izq ? 'transparent, black 24px' : 'black', bordes.der ? 'black calc(100% - 24px), transparent' : 'black'].join(', ');

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
      <div
        ref={ref}
        onScroll={medir}
        role="tablist"
        aria-label="Secciones del reporte"
        className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: `linear-gradient(to right, ${mascara})`, WebkitMaskImage: `linear-gradient(to right, ${mascara})` }}
      >
        {TABS.map((t) => {
          const Icono = t.icon;
          const seleccionada = activa === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => onCambiar(t.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                seleccionada ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent-soft hover:text-foreground'
              }`}
            >
              <Icono className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Card({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}

function Tabla({ columnas, filas, vacio }: { columnas: string[]; filas: (string | number)[][]; vacio: string }) {
  if (filas.length === 0) return <p className="text-sm text-muted-foreground">{vacio}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-panel">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {columnas.map((c) => (
              <th key={c} className="px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {fila.map((valor, j) => (
                <td key={j} className="px-3 py-2">
                  {valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
