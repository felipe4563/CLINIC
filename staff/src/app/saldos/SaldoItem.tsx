'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export type Saldo = {
  id: number;
  monto: string;
  monto_total: string;
  Cita: {
    fecha: string;
    hora_inicio: string;
    Paciente: { id: number; nombre_completo: string; telefono: string };
    Profesional: { nombre: string };
    Servicio: { nombre: string };
  };
};

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export default function SaldoItem({ saldo, onCobrado }: { saldo: Saldo; onCobrado: () => void }) {
  const [modo, setModo] = useState<'idle' | 'qr'>('idle');
  const [cobrandoEfectivo, setCobrandoEfectivo] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const montoSaldo = Number(saldo.monto_total) - Number(saldo.monto);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function cobrarEfectivo() {
    if (!window.confirm(`¿Confirmar que ${saldo.Cita.Paciente.nombre_completo} pagó Bs ${montoSaldo.toFixed(2)} en efectivo?`)) return;
    setCobrandoEfectivo(true);
    setError('');
    try {
      await api.marcarSaldoEfectivo(saldo.id);
      onCobrado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el cobro');
      setCobrandoEfectivo(false);
    }
  }

  async function abrirQR() {
    setModo('qr');
    setError('');
    try {
      const res = await api.generarQRSaldo(saldo.id);
      setQr(res.qrImageBase64);
      pollRef.current = setInterval(async () => {
        try {
          const estado = await api.estadoSaldoQR(saldo.id);
          if (estado.pagado) {
            if (pollRef.current) clearInterval(pollRef.current);
            onCobrado();
          }
        } catch {
          // el polling reintenta solo
        }
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el QR');
    }
  }

  function cerrarQR() {
    if (pollRef.current) clearInterval(pollRef.current);
    setModo('idle');
    setQr(null);
    setError('');
  }

  async function verificarAhora() {
    setVerificando(true);
    setError('');
    try {
      const estado = await api.estadoSaldoQR(saldo.id);
      if (estado.pagado) {
        if (pollRef.current) clearInterval(pollRef.current);
        onCobrado();
      } else {
        setError('Todavía no detectamos el pago. Si ya se pagó, espera unos segundos e intenta de nuevo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar');
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href={`/pacientes/${saldo.Cita.Paciente.id}`} className="font-medium hover:text-accent hover:underline">
            {saldo.Cita.Paciente.nombre_completo}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {saldo.Cita.Servicio.nombre} con {saldo.Cita.Profesional.nombre} · {fmtFecha(saldo.Cita.fecha)} {saldo.Cita.hora_inicio.slice(0, 5)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pagó Bs {Number(saldo.monto).toFixed(2)} de Bs {Number(saldo.monto_total).toFixed(2)}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
          <span className="rounded-full bg-stat-amber-soft px-3 py-1 text-xs font-medium text-stat-amber">
            Saldo: Bs {montoSaldo.toFixed(2)}
          </span>
          {modo === 'idle' && (
            <div className="flex gap-2">
              <button
                onClick={cobrarEfectivo}
                disabled={cobrandoEfectivo}
                className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent-soft disabled:opacity-60"
              >
                {cobrandoEfectivo ? 'Guardando…' : 'Efectivo'}
              </button>
              <button onClick={abrirQR} className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                Cobrar con QR
              </button>
            </div>
          )}
        </div>
      </div>

      {modo === 'qr' && (
        <div className="mt-3 flex flex-col items-center gap-3 border-t border-border pt-3 text-center">
          {qr ? (
            <img src={`data:image/png;base64,${qr}`} alt="QR de pago" className="w-48" />
          ) : (
            !error && <p className="text-xs text-muted-foreground">Generando QR…</p>
          )}
          {qr && (
            <p className="text-xs text-muted-foreground">
              Que el paciente escanee el código con su app bancaria. Estamos revisando automáticamente si ya llegó el pago.
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            {qr && (
              <button
                onClick={verificarAhora}
                disabled={verificando}
                className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-60"
              >
                {verificando ? 'Verificando…' : 'Ya pagó, verificar ahora'}
              </button>
            )}
            <button onClick={cerrarQR} className="rounded border border-border px-3 py-1.5 text-xs">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modo === 'idle' && error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
