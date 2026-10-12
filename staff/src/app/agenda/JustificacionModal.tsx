'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import type { Cita } from './DayAgendaCards';
import { fmtFechaHora } from './politica';

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function JustificacionModal({ cita, onClose, onCambio }: { cita: Cita; onClose: () => void; onCambio: () => void }) {
  const [nota, setNota] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function registrar(decision: 'aceptada' | 'rechazada', e?: FormEvent) {
    e?.preventDefault();
    if (!nota.trim()) {
      setError('Escribe una nota con el motivo');
      return;
    }
    if (archivo && (!TIPOS.includes(archivo.type) || archivo.size > MAX_BYTES)) {
      setError('Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api.registrarJustificacion(cita.id, { decision, nota: nota.trim(), archivo });
      onCambio();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la justificación');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Registrar justificación" onClick={(e) => e.stopPropagation()} onSubmit={(e) => registrar('aceptada', e)} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Registrar justificación</h2>
            <p className="text-sm text-muted-foreground">{cita.Paciente.nombre_completo} · {cita.fecha} {cita.hora_inicio.slice(0, 5)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        <p className={`mb-3 text-sm ${cita.politica.justificacionFueraDePlazo ? 'text-stat-amber' : 'text-muted-foreground'}`}>
          {cita.politica.justificacionFueraDePlazo
            ? `Fuera de plazo: el límite era el ${fmtFechaHora(cita.politica.limiteJustificar)}. Puedes registrarla igual si la clínica decide hacer una excepción.`
            : `Plazo para justificar: hasta el ${fmtFechaHora(cita.politica.limiteJustificar)}.`}
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Nota (obligatoria)
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} required placeholder="Ej. Certificado médico del 14/10 enviado por WhatsApp" className="rounded-lg border border-border bg-background px-3 py-2" />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          Prueba (opcional): imagen o PDF de hasta 5 MB
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} className="text-sm" />
        </label>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={guardando} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">Aceptar justificación</button>
          <button type="button" onClick={() => registrar('rechazada')} disabled={guardando} className="flex-1 rounded-lg border border-danger px-3 py-2 text-sm font-medium text-danger disabled:opacity-50">Rechazar</button>
        </div>
      </form>
    </div>
  );
}
