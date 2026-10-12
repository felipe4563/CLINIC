'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import LectorTarjeta from './LectorTarjeta';
import { CartillasSellos, type Cartilla, type PremioDisponible } from './CartillasSellos';

type Resultado = {
  paciente: { id: number; codigo_paciente: string; nombre_completo: string; telefono: string; puntos_actuales: number };
  cartillas: Cartilla[];
  premiosDisponibles: PremioDisponible[];
};

// Ventana "Pasar tarjeta": identifica a la paciente y le muestra su cartilla.
export default function PasarTarjetaModal({ uidInicial, onClose }: { uidInicial?: string | null; onClose: () => void }) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(Boolean(uidInicial));

  const consultar = useCallback((uid: string) => {
    return api
      .buscarTarjeta(uid)
      .then((r: Resultado) => setResultado(r))
      .catch((err: unknown) => {
        const mensaje = err instanceof Error ? err.message : 'No se pudo leer la tarjeta';
        setError(
          mensaje === 'Tarjeta no registrada'
            ? 'Tarjeta no registrada. Para entregarla, abre la ficha de la paciente y usa "Vincular tarjeta".'
            : mensaje,
        );
      })
      .finally(() => setBuscando(false));
  }, []);

  function buscar(uid: string) {
    setBuscando(true);
    setError(null);
    setResultado(null);
    consultar(uid);
  }

  // El lector USB ya leyó la tarjeta antes de abrir la ventana.
  useEffect(() => {
    if (uidInicial) consultar(uidInicial);
  }, [uidInicial, consultar]);

  useEffect(() => {
    function alPresionarEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', alPresionarEscape);
    return () => document.removeEventListener('keydown', alPresionarEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pasar tarjeta"
        onClick={(e) => e.stopPropagation()}
        className="thin-scroll max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-panel p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold">Tarjeta de fidelización</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        <LectorTarjeta onLeido={buscar} ocupado={buscando} />
        {buscando && <p className="mt-3 text-sm text-muted-foreground">Buscando…</p>}
        {error && <p className="mt-3 rounded-lg border border-danger/40 p-3 text-sm text-danger">{error}</p>}

        {resultado && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg bg-background p-3">
              <p className="text-lg font-semibold">{resultado.paciente.nombre_completo}</p>
              <p className="text-xs text-muted-foreground">
                {resultado.paciente.codigo_paciente} · {resultado.paciente.telefono}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">{resultado.paciente.puntos_actuales}</span> puntos
              </p>
            </div>
            <CartillasSellos cartillas={resultado.cartillas} premios={resultado.premiosDisponibles} />
            <div className="flex flex-wrap gap-2">
              <Link href={`/pacientes/${resultado.paciente.id}`} onClick={onClose} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
                Ver ficha
              </Link>
              <Link href="/fidelizacion" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft">
                Canjear puntos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
