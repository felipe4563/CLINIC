'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export type FilaTratamiento = {
  tipo: 'cita' | 'manual';
  fecha: string;
  procedimiento: string;
  observacion: string | null;
  citaId: number | null;
  notaId: number | null;
  faltaObservacion: boolean;
};

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// "Tratamiento estético realizado": sesiones atendidas (con su observación) y
// filas manuales. Escribir una observación o agregar una fila guarda de inmediato.
export default function TablaTratamientos({ pacienteId, filas, desde, onCambio }: { pacienteId: string; filas: FilaTratamiento[]; desde: string; onCambio: () => void | Promise<void> }) {
  const [observando, setObservando] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [manual, setManual] = useState<{ fecha: string; procedimiento: string; observacion: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardarObservacion(fila: FilaTratamiento, e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setError(null);
    try {
      await api.crearTratamiento(pacienteId, { citaId: fila.citaId, titulo: fila.procedimiento, notas: texto.trim() });
      setObservando(null);
      setTexto('');
      await onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la observación');
    }
  }

  async function guardarManual(e: FormEvent) {
    e.preventDefault();
    if (!manual || !manual.procedimiento.trim() || !manual.observacion.trim()) return;
    setError(null);
    try {
      await api.crearTratamiento(pacienteId, { fecha: manual.fecha, titulo: manual.procedimiento.trim(), notas: manual.observacion.trim() });
      setManual(null);
      await onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar la fila');
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Procedimiento</th>
              <th className="px-3 py-2">Observación / evaluación</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-3 text-muted-foreground">Sin sesiones desde esta evaluación.</td></tr>
            )}
            {filas.map((f) => (
              <tr key={`${f.tipo}-${f.citaId ?? f.notaId}`} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-3 py-2">{fmtFecha(f.fecha)}</td>
                <td className="px-3 py-2">{f.procedimiento}{f.tipo === 'manual' && <span className="ml-1 text-xs text-muted-foreground">(manual)</span>}</td>
                <td className="px-3 py-2">
                  {!f.faltaObservacion && <span className="whitespace-pre-line">{f.observacion}</span>}
                  {f.faltaObservacion && observando !== f.citaId && (
                    <button type="button" onClick={() => { setObservando(f.citaId); setTexto(''); }} className="text-xs font-medium text-danger hover:underline">
                      Falta observación — escribir
                    </button>
                  )}
                  {f.faltaObservacion && observando === f.citaId && (
                    <form onSubmit={(e) => guardarObservacion(f, e)} className="flex flex-col gap-1.5">
                      <textarea autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} aria-label="Observación de la sesión" className="rounded border border-border px-2 py-1 text-sm" />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded bg-accent px-2.5 py-1 text-xs text-accent-foreground">Guardar</button>
                        <button type="button" onClick={() => setObservando(null)} className="rounded border border-border px-2.5 py-1 text-xs">Cancelar</button>
                      </div>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {manual ? (
        <form onSubmit={guardarManual} className="mt-2 grid grid-cols-1 gap-2 rounded border border-accent p-3 sm:grid-cols-[140px_1fr_2fr_auto]">
          <input type="date" required value={manual.fecha} min={desde} onChange={(e) => setManual({ ...manual, fecha: e.target.value })} aria-label="Fecha" className="rounded border border-border px-2 py-1 text-sm" />
          <input required value={manual.procedimiento} onChange={(e) => setManual({ ...manual, procedimiento: e.target.value })} placeholder="Procedimiento" className="rounded border border-border px-2 py-1 text-sm" />
          <input required value={manual.observacion} onChange={(e) => setManual({ ...manual, observacion: e.target.value })} placeholder="Observación" className="rounded border border-border px-2 py-1 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-accent px-2.5 py-1 text-xs text-accent-foreground">Agregar</button>
            <button type="button" onClick={() => setManual(null)} className="rounded border border-border px-2.5 py-1 text-xs">Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setManual({ fecha: desde, procedimiento: '', observacion: '' })} className="mt-2 rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
          + Agregar fila manual
        </button>
      )}
    </div>
  );
}
