'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Cita } from './DayAgendaCards';
import { avisoWhatsAppTexto, fmtFechaHora } from './politica';

type Slot = { hora_inicio: string; hora_fin: string };

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReprogramarModal({ cita, onClose, onCambio }: { cita: Cita; onClose: () => void; onCambio: (aviso: string | null) => void }) {
  const [fecha, setFecha] = useState(hoy());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    api
      .getDisponibilidad(cita.Profesional.id, cita.Servicio.id, fecha)
      .then((lista: Slot[]) => {
        if (!vigente) return;
        setSlots(lista);
        setHoraInicio('');
      })
      .catch(() => vigente && setSlots([]));
    return () => {
      vigente = false;
    };
  }, [cita.Profesional.id, cita.Servicio.id, fecha]);

  async function guardar() {
    if (!horaInicio) return;
    setGuardando(true);
    setError('');
    try {
      const res = await api.reprogramarCita(cita.id, fecha, horaInicio);
      onCambio(avisoWhatsAppTexto(res.avisoWhatsApp));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reprogramar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Reprogramar cita" onClick={(e) => e.stopPropagation()} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Reprogramar sin volver a pagar</h2>
            <p className="text-sm text-muted-foreground">{cita.Paciente.nombre_completo} · {cita.Servicio.nombre}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        {cita.politica.limiteReprogramar && (
          <p className={`mb-3 text-sm ${cita.politica.reprogramacionFueraDePlazo ? 'text-stat-amber' : 'text-muted-foreground'}`}>
            {cita.politica.reprogramacionFueraDePlazo
              ? `Fuera de plazo: el límite era el ${fmtFechaHora(cita.politica.limiteReprogramar)}. Puedes reprogramar igual si la clínica lo decide.`
              : `Plazo para reprogramar: hasta el ${fmtFechaHora(cita.politica.limiteReprogramar)}.`}
          </p>
        )}

        <label className="text-sm">
          Nueva fecha
          <input type="date" min={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded border border-border px-2 py-1.5" />
        </label>
        <div className="mt-3 text-sm">
          Horario disponible
          <div className="mt-1 flex flex-wrap gap-2">
            {slots.length === 0 && <p className="text-xs text-muted-foreground">No hay horarios libres ese día.</p>}
            {slots.map((s) => (
              <button type="button" key={s.hora_inicio} onClick={() => setHoraInicio(s.hora_inicio)} className={`rounded-full border px-3 py-1 text-xs ${horaInicio === s.hora_inicio ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'}`}>
                {s.hora_inicio}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button onClick={guardar} disabled={!horaInicio || guardando} className="mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {guardando ? 'Guardando…' : 'Reprogramar'}
        </button>
      </div>
    </div>
  );
}
