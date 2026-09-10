'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import SaldoItem, { type Saldo } from './SaldoItem';

export default function SaldosPage() {
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSaldos(await api.getSaldosPendientes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los saldos pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalPendiente = saldos.reduce((acc, s) => acc + (Number(s.monto_total) - Number(s.monto)), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Saldos pendientes</h1>
          <p className="text-sm text-muted-foreground">Citas con seña (50%) pagada, saldo por cobrar en clínica.</p>
        </div>
        {saldos.length > 0 && (
          <p className="text-sm font-medium">
            Total pendiente: <span className="text-accent">Bs {totalPendiente.toFixed(2)}</span>
          </p>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="flex flex-col gap-2">
        {saldos.map((s) => (
          <SaldoItem key={s.id} saldo={s} onCobrado={cargar} />
        ))}
        {!loading && saldos.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No hay saldos pendientes por cobrar.</p>
        )}
      </div>
    </div>
  );
}
