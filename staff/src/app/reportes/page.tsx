'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { IconBarChart } from '@/components/icons';

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

type Personal = {
  porEmpleado: { usuario: string; diasTrabajados: number; horasTrabajadas: number; ausencias: unknown[] }[];
};

const TABS = [
  { key: 'financiero', label: 'Financiero' },
  { key: 'citas-pacientes', label: 'Citas y Pacientes' },
  { key: 'ventas', label: 'Ventas e Inventario' },
  { key: 'personal', label: 'Personal' },
] as const;

type Tab = (typeof TABS)[number]['key'];

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

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inicioMesISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function ReportesPage() {
  const [tab, setTab] = useState<Tab>('financiero');
  const [desde, setDesde] = useState(inicioMesISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [financiero, setFinanciero] = useState<Financiero | null>(null);
  const [citas, setCitas] = useState<Citas | null>(null);
  const [pacientes, setPacientes] = useState<Pacientes | null>(null);
  const [ventas, setVentas] = useState<Ventas | null>(null);
  const [personal, setPersonal] = useState<Personal | null>(null);

  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
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
      if (tab === 'personal') setPersonal(await api.getReporte('personal', params));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
    } finally {
      setCargando(false);
    }
  }, [tab, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
      <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <IconBarChart className="h-5 w-5 text-muted-foreground" />
        Reportes
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">Resumen operativo de la clínica, exportable en PDF.</p>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-lg border border-border px-2.5 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-lg border border-border px-2.5 py-1.5 text-sm" />
        </label>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {cargando && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!cargando && tab === 'financiero' && financiero && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => descargarPDF('financiero')} disabled={descargando} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60">
              {descargando ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
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

      {!cargando && tab === 'citas-pacientes' && citas && pacientes && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end gap-2">
            <button onClick={() => descargarPDF('citas')} disabled={descargando} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60">
              PDF de citas
            </button>
            <button onClick={() => descargarPDF('pacientes')} disabled={descargando} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60">
              PDF de pacientes
            </button>
          </div>
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

      {!cargando && tab === 'ventas' && ventas && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => descargarPDF('ventas')} disabled={descargando} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60">
              {descargando ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
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

      {!cargando && tab === 'personal' && personal && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => descargarPDF('personal')} disabled={descargando} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-60">
              {descargando ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
          <Tabla
            columnas={['Empleado', 'Días trabajados', 'Horas trabajadas', 'Ausencias']}
            filas={personal.porEmpleado.map((e) => [e.usuario, e.diasTrabajados, e.horasTrabajadas, e.ausencias.length])}
            vacio="Sin registros en este periodo."
          />
        </div>
      )}
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
