'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { IconCalendar, IconClock, IconUserPlus, IconWallet, IconShoppingCart, IconCashRegister, IconAlertCircle } from '@/components/icons';

type Cita = {
  id: number;
  fecha: string;
  hora_inicio: string;
  Paciente: { nombre_completo: string };
  Profesional: { nombre: string };
  Servicio: { nombre: string };
};

type IngresoDia = { fecha: string; citas: number; ventas: number; total: number };
type CitaPorServicio = { servicio: string; cantidad: number };

type Dashboard = {
  periodo: 'dia' | 'mes' | 'anio';
  citasHoy: number;
  citasPeriodo: number;
  pacientesNuevos: number;
  ingresosPeriodo: number;
  proximasCitas: Cita[];
  saldosPendientes: { cantidad: number; total: number };
  cajaHoy: { ingresos: number; egresos: number; saldoNeto: number } | null;
  ventasHoy: { cantidad: number; total: number } | null;
  inventario: { stockBajo: number; porVencer: number } | null;
  activos: { operativos: number; mantenimiento: number } | null;
  ingresosPorDia: IngresoDia[];
  citasPorServicio: CitaPorServicio[];
};

const PERIODOS: { value: Dashboard['periodo']; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
];

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatFechaLarga() {
  return new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatBs(monto: number) {
  return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function mesActualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_DISPONIBLES = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - i);

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [periodo, setPeriodo] = useState<Dashboard['periodo']>('mes');
  const [fechaDia, setFechaDia] = useState(hoyISO());
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActualISO());
  const [anioSeleccionado, setAnioSeleccionado] = useState(ANIO_ACTUAL);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fechaParam =
    periodo === 'dia' ? fechaDia : periodo === 'mes' ? `${mesSeleccionado}-01` : `${anioSeleccionado}-01-01`;

  const cargar = useCallback(async (p: Dashboard['periodo'], fecha: string) => {
    setError(null);
    try {
      setData(await api.getDashboard(p, fecha));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
    }
  }, []);

  useEffect(() => {
    cargar(periodo, fechaParam);
  }, [periodo, fechaParam, cargar]);

  return (
    <div>
      <div
        className="mb-6 overflow-hidden rounded-xl px-6 py-8 text-white sm:px-8"
        style={{ background: 'linear-gradient(135deg, var(--banner-from), var(--banner-to))' }}
      >
        <p className="text-sm capitalize opacity-80">{formatFechaLarga()}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {saludo()}, {usuario?.nombre.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm opacity-80">Panel principal</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-panel p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                periodo === p.value ? 'bg-accent text-accent-foreground' : 'text-foreground/70 hover:bg-accent-soft'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodo === 'dia' && (
          <input
            type="date"
            value={fechaDia}
            onChange={(e) => setFechaDia(e.target.value)}
            className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm"
          />
        )}
        {periodo === 'mes' && (
          <div className="flex gap-2">
            <select
              value={mesSeleccionado.slice(5, 7)}
              onChange={(e) => setMesSeleccionado(`${mesSeleccionado.slice(0, 4)}-${e.target.value}`)}
              className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm"
            >
              {MESES_NOMBRES.map((nombre, i) => (
                <option key={nombre} value={pad(i + 1)}>
                  {nombre}
                </option>
              ))}
            </select>
            <select
              value={mesSeleccionado.slice(0, 4)}
              onChange={(e) => setMesSeleccionado(`${e.target.value}-${mesSeleccionado.slice(5, 7)}`)}
              className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm"
            >
              {ANIOS_DISPONIBLES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
        {periodo === 'anio' && (
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm"
          >
            {ANIOS_DISPONIBLES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {data && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<IconCalendar />} label="Citas de hoy" value={String(data.citasHoy)} color="blue" />
          <StatCard icon={<IconClock />} label={`Citas del ${periodoLabel(periodo)}`} value={String(data.citasPeriodo)} color="amber" />
          <StatCard icon={<IconUserPlus />} label="Pacientes nuevos" value={String(data.pacientesNuevos)} color="green" />
          <StatCard icon={<IconWallet />} label="Ingresos del período" value={`Bs ${formatBs(data.ingresosPeriodo)}`} color="rose" />
        </div>
      )}

      {data && (data.cajaHoy || data.ventasHoy || data.saldosPendientes) && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.cajaHoy && (
            <StatCard
              icon={<IconCashRegister />}
              label="Saldo de caja hoy"
              value={`Bs ${formatBs(data.cajaHoy.saldoNeto)}`}
              color={data.cajaHoy.saldoNeto < 0 ? 'rose' : 'green'}
              href="/caja"
            />
          )}
          {data.ventasHoy && (
            <StatCard
              icon={<IconShoppingCart />}
              label="Ventas de hoy"
              value={`${data.ventasHoy.cantidad} · Bs ${formatBs(data.ventasHoy.total)}`}
              color="blue"
              href="/ventas"
            />
          )}
          <StatCard
            icon={<IconWallet />}
            label="Saldos pendientes de cobro"
            value={`${data.saldosPendientes.cantidad} · Bs ${formatBs(data.saldosPendientes.total)}`}
            color="amber"
            href="/saldos"
          />
          {data.inventario && (data.inventario.stockBajo > 0 || data.inventario.porVencer > 0) && (
            <StatCard
              icon={<IconAlertCircle />}
              label="Alertas de inventario"
              value={`${data.inventario.stockBajo} stock bajo · ${data.inventario.porVencer} por vencer`}
              color="rose"
              href="/inventario"
            />
          )}
        </div>
      )}

      {data && (data.ingresosPorDia.some((d) => d.total > 0) || data.citasPorServicio.length > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          {data.ingresosPorDia.some((d) => d.total > 0) && (
            <div className="rounded-xl border border-border bg-panel p-5">
              <h2 className="mb-1 text-sm font-semibold">Ingresos de los últimos 14 días</h2>
              <p className="mb-3 text-xs text-muted-foreground">Citas pagadas + ventas de mostrador, por día</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.ingresosPorDia} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--stat-blue)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--stat-blue)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(f: string) => f.slice(5).split('-').reverse().join('/')}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(f) => String(f).slice(5).split('-').reverse().join('/')}
                      formatter={(value, name) => [`Bs ${formatBs(Number(value))}`, name === 'citas' ? 'Citas' : 'Ventas']}
                    />
                    <Area type="monotone" dataKey="citas" stackId="1" stroke="var(--accent)" fill="url(#gradCitas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="ventas" stackId="1" stroke="var(--stat-blue)" fill="url(#gradVentas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} /> Citas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--stat-blue)' }} /> Ventas
                </span>
              </div>
            </div>
          )}

          {data.citasPorServicio.length > 0 && (
            <div className="rounded-xl border border-border bg-panel p-5">
              <h2 className="mb-1 text-sm font-semibold">Citas por servicio</h2>
              <p className="mb-3 text-xs text-muted-foreground">En el {periodoLabel(periodo)} seleccionado</p>
              <div style={{ height: Math.max(data.citasPorServicio.length * 34, 120) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.citasPorServicio} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="servicio"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(value) => [`${value} citas`, '']}
                      labelFormatter={() => ''}
                    />
                    <Bar dataKey="cantidad" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Próximas citas</h2>
            <Link href="/agenda" className="text-sm text-accent hover:underline">
              Ver agenda →
            </Link>
          </div>

          {data && data.proximasCitas.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay citas próximas.</p>
          )}

          <div className="flex flex-col gap-2">
            {data?.proximasCitas.map((cita) => (
              <div key={cita.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="font-medium">
                  {cita.fecha} · {cita.hora_inicio.slice(0, 5)}
                </span>
                <span className="text-muted-foreground">
                  {cita.Paciente.nombre_completo} — {cita.Servicio.nombre} con {cita.Profesional.nombre}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {data?.activos && (
            <div className="rounded-xl border border-border bg-panel p-5">
              <h2 className="mb-3 text-sm font-semibold">Activos de la clínica</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Operativos</span>
                <span className="font-medium text-stat-green">{data.activos.operativos}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En mantenimiento</span>
                <span className="font-medium text-stat-amber">{data.activos.mantenimiento}</span>
              </div>
              <Link href="/inventario" className="mt-3 inline-block text-sm text-accent hover:underline">
                Ver inventario →
              </Link>
            </div>
          )}

          <div className="rounded-xl border border-border bg-panel p-5">
            <h2 className="mb-3 text-sm font-semibold">Accesos rápidos</h2>
            <div className="flex flex-col gap-2">
              <Link href="/agenda" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft">
                + Nueva cita
              </Link>
              <Link href="/pacientes" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft">
                + Nuevo paciente
              </Link>
              {data?.ventasHoy && (
                <Link href="/ventas" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft">
                  + Nueva venta (POS)
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function periodoLabel(p: Dashboard['periodo']) {
  return p === 'dia' ? 'día' : p === 'anio' ? 'año' : 'mes';
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'amber' | 'rose' | 'green';
  href?: string;
}) {
  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `var(--stat-${color}-soft)`, color: `var(--stat-${color})` }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-semibold">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-start gap-3 rounded-xl border border-border bg-panel p-4 transition-colors hover:border-accent">
        {content}
      </Link>
    );
  }

  return <div className="flex items-start gap-3 rounded-xl border border-border bg-panel p-4">{content}</div>;
}
