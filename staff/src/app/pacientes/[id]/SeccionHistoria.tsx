'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export type AlertaAlergias = { alergias: boolean; detalle: string | null };
type Evaluacion = { id: number; fecha: string; autor: string | null; actualizada: string | null; firmado: boolean };

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// Lista de evaluaciones de la historia clínica (solo con permiso historia_clinica).
export default function SeccionHistoria({ pacienteId, onAlerta }: { pacienteId: string; onAlerta: (a: AlertaAlergias) => void }) {
  const router = useRouter();
  const [historias, setHistorias] = useState<Evaluacion[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.getHistoriasPaciente(pacienteId);
      setHistorias(res.historias);
      onAlerta(res.alerta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la historia clínica');
    }
  }, [pacienteId, onAlerta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function nueva() {
    setOcupado(true);
    setError(null);
    try {
      const anterior = historias && historias.length > 0 ? historias[0].id : undefined;
      const creada = await api.crearHistoria(pacienteId, anterior);
      router.push(`/pacientes/${pacienteId}/historia/${creada.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la evaluación');
      setOcupado(false);
    }
  }

  async function descargar(accion: () => Promise<unknown>) {
    setError(null);
    try {
      await accion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar');
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Historia clínica</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => descargar(() => api.descargarHistoriaEnBlanco('pdf'))} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
            Formulario en blanco (PDF)
          </button>
          <button onClick={() => descargar(() => api.descargarHistoriaEnBlanco('docx'))} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
            En blanco (Word)
          </button>
          <button onClick={nueva} disabled={ocupado} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50">
            {ocupado ? 'Creando…' : '+ Nueva evaluación'}
          </button>
        </div>
      </div>
      {error && <p className="mb-2 text-xs text-danger">{error}</p>}
      {historias && historias.length === 0 && (
        <p className="text-sm text-foreground/70">Sin evaluaciones. &quot;Nueva evaluación&quot; abre el formulario de historia clínica.</p>
      )}
      {historias && historias.length > 0 && (
        <p className="mb-2 text-xs text-muted-foreground">&quot;Nueva evaluación&quot; copia la más reciente para que solo corrijas lo que cambió.</p>
      )}
      <div className="flex flex-col gap-2">
        {(historias || []).map((h) => (
          <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-panel p-3 text-sm">
            <div>
              <p className="font-medium">Evaluación del {fmtFecha(h.fecha)}</p>
              <p className="text-xs text-muted-foreground">
                {h.autor || h.actualizada ? `Última edición: ${[h.autor, h.actualizada ? fmtFecha(h.actualizada.slice(0, 10)) : null].filter(Boolean).join(' · ')}` : ''}
                {h.firmado ? ' · ✓ Firmada' : ' · Sin documento firmado'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/pacientes/${pacienteId}/historia/${h.id}`} className="rounded border border-border px-2.5 py-1 text-xs hover:bg-accent-soft">
                Ver / editar
              </Link>
              <button onClick={() => descargar(() => api.descargarHistoriaPdf(h.id))} className="rounded border border-border px-2.5 py-1 text-xs hover:bg-accent-soft">PDF</button>
              <button onClick={() => descargar(() => api.descargarHistoriaWord(h.id))} className="rounded border border-border px-2.5 py-1 text-xs hover:bg-accent-soft">Word</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
