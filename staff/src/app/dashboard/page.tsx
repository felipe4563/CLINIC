'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [periodo, setPeriodo] = useState<Dashboard['periodo']>('mes');
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (p: Dashboard['periodo']) => {
    setError(null);
    try {
      setData(await api.getDashboard(p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
    }
  }, []);

  useEffect(() => {
    cargar(periodo);
  }, [periodo, cargar]);

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
