'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';
import { IconCashRegister } from '@/components/icons';

type Movimiento = {
  id: number;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: string;
  pago_id: number | null;
  Usuario: { nombre: string };
};

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sumarDias(fecha: string, dias: number) {
  const [a, m, d] = fecha.split('-').map(Number);
  const dt = new Date(a, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function fmtFechaLarga(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function CajaPage() {
  const [fecha, setFecha] = useState(hoyISO());
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);
  const [saldoNeto, setSaldoNeto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('egreso');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCaja(fecha);
      setMovimientos(res.movimientos);
      setTotalIngresos(res.totalIngresos);
      setTotalEgresos(res.totalEgresos);
      setSaldoNeto(res.saldoNeto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la caja');
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.crearMovimientoCaja({ tipo, concepto, monto: Number(monto), fecha });
      setConcepto('');
      setMonto('');
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    if (!window.confirm('¿Eliminar este movimiento de caja?')) return;
    try {
      await api.eliminarMovimientoCaja(id);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconCashRegister className="h-5 w-5 text-muted-foreground" />
          Caja
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setFecha(sumarDias(fecha, -1))} className="rounded-lg border border-border px-2.5 py-1.5 text-sm hover:bg-accent-soft">
            ←
          </button>
          <button onClick={() => setFecha(hoyISO())} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft">
            Hoy
          </button>
          <button onClick={() => setFecha(sumarDias(fecha, 1))} className="rounded-lg border border-border px-2.5 py-1.5 text-sm hover:bg-accent-soft">
            →
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm capitalize text-muted-foreground">{fmtFechaLarga(fecha)}</p>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="mt-1 text-xl font-semibold text-stat-green">Bs {totalIngresos.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs text-muted-foreground">Egresos</p>
          <p className="mt-1 text-xl font-semibold text-stat-rose">Bs {totalEgresos.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs text-muted-foreground">Saldo neto</p>
          <p className="mt-1 text-xl font-semibold">Bs {saldoNeto.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Movimientos</h2>
        <button
          onClick={() => setFormAbierto((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
        >
          {formAbierto ? 'Cancelar' : '+ Nuevo movimiento'}
        </button>
      </div>

      {formAbierto && (
        <form onSubmit={crear} className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-4">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as 'ingreso' | 'egreso')} className="rounded border border-border px-2.5 py-1.5">
            <option value="egreso">Egreso</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <input
            required
            placeholder="Concepto (ej. Compra de insumos)"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="rounded border border-border px-2.5 py-1.5 sm:col-span-2"
          />
          <input
            type="number"
            step="0.01"
            required
            placeholder="Monto (Bs)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="rounded border border-border px-2.5 py-1.5"
          />
          <button
            type="submit"
            disabled={guardando}
            className="rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-4"
          >
            {guardando ? 'Guardando…' : 'Registrar movimiento'}
          </button>
        </form>
      )}

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="flex flex-col gap-2">
        {movimientos.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{m.concepto}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {m.Usuario.nombre}
                {m.pago_id ? ' · generado automáticamente por un cobro' : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`font-medium ${m.tipo === 'ingreso' ? 'text-stat-green' : 'text-stat-rose'}`}>
                {m.tipo === 'ingreso' ? '+' : '−'} Bs {Number(m.monto).toFixed(2)}
              </span>
              {!m.pago_id && (
                <button onClick={() => eliminar(m.id)} className="text-xs text-danger hover:underline">
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && movimientos.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Sin movimientos registrados este día.</p>
        )}
      </div>
    </div>
  );
}
