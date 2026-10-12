'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import LectorTarjeta from '@/components/tarjeta/LectorTarjeta';
import { CartillasSellos, type Cartilla, type PremioDisponible } from '@/components/tarjeta/CartillasSellos';

type Tarjeta = { id: number; uid: string; estado: 'activa' | 'bloqueada' };
type Datos = { tarjeta: Tarjeta | null; cartillas: Cartilla[]; premiosDisponibles: PremioDisponible[] };

// Tarjeta física de la paciente (vincular / reemplazar / bloquear) y su cartilla de sellos.
export default function SeccionTarjeta({ pacienteId }: { pacienteId: string }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api.getTarjetaPaciente(pacienteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la tarjeta');
    }
  }, [pacienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function vincular(uid: string) {
    setOcupado(true);
    setError(null);
    try {
      await api.vincularTarjeta(pacienteId, uid);
      setVinculando(false);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo vincular la tarjeta');
    } finally {
      setOcupado(false);
    }
  }

  async function bloquear() {
    if (!datos?.tarjeta) return;
    if (!window.confirm('¿Bloquear esta tarjeta? Dejará de funcionar (por ejemplo, si se perdió). Los sellos no se pierden.')) return;
    setOcupado(true);
    setError(null);
    try {
      await api.bloquearTarjeta(datos.tarjeta.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo bloquear la tarjeta');
    } finally {
      setOcupado(false);
    }
  }

  const tarjeta = datos?.tarjeta;

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Tarjeta de sellos</h2>
        <div className="flex gap-2">
          {tarjeta && !vinculando && (
            <button onClick={bloquear} disabled={ocupado} className="rounded-lg border border-border px-3 py-1.5 text-xs text-danger hover:bg-accent-soft disabled:opacity-50">
              Bloquear tarjeta
            </button>
          )}
          <button
            onClick={() => {
              setError(null);
              setVinculando((v) => !v);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
          >
            {vinculando ? 'Cancelar' : tarjeta ? 'Reemplazar tarjeta' : '+ Vincular tarjeta'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-panel p-3 text-sm">
        <p className="mb-3 text-xs text-muted-foreground">
          {tarjeta ? (
            <>Tarjeta activa · termina en <span className="font-mono">…{tarjeta.uid.slice(-4)}</span></>
          ) : (
            'Sin tarjeta vinculada. Los sellos se suman igual al completar sus citas.'
          )}
        </p>

        {vinculando && (
          <div className="mb-3 rounded-lg border border-accent p-3">
            <p className="mb-2 text-xs text-muted-foreground">
              {tarjeta ? 'La tarjeta actual quedará bloqueada. ' : ''}Pasa la tarjeta nueva por el lector o acércala al celular.
            </p>
            <LectorTarjeta onLeido={vincular} ocupado={ocupado} />
          </div>
        )}
        {error && <p className="mb-3 text-xs text-danger">{error}</p>}

        {datos && <CartillasSellos cartillas={datos.cartillas} premios={datos.premiosDisponibles} />}
      </div>
    </div>
  );
}
