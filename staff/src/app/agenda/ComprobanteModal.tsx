'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Cita } from './DayAgendaCards';
import ArchivoPrivado from './ArchivoPrivado';
import { REVISION_LABEL, avisoWhatsAppTexto } from './politica';

export default function ComprobanteModal({ cita, onClose, onCambio }: { cita: Cita; onClose: () => void; onCambio: (aviso: string | null) => void }) {
  const pago = cita.Pago!;
  const [confirmandoInvalido, setConfirmandoInvalido] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function revisar(resultado: 'valido' | 'invalido') {
    setGuardando(true);
    setError('');
    try {
      const res = await api.revisarComprobante(pago.id, resultado);
      onCambio(avisoWhatsAppTexto(res.avisoWhatsApp));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la revisión');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Comprobante de pago" onClick={(e) => e.stopPropagation()} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Comprobante de pago</h2>
            <p className="text-sm text-muted-foreground">{cita.Paciente.nombre_completo} · {cita.fecha} {cita.hora_inicio.slice(0, 5)}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-background p-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Debe decir</p><p className="font-semibold">Bs {pago.monto}</p></div>
          <div><p className="text-xs text-muted-foreground">Porcentaje</p><p>{pago.porcentaje}%</p></div>
          <div><p className="text-xs text-muted-foreground">Total servicio</p><p>Bs {pago.monto_total}</p></div>
        </div>

        <ArchivoPrivado ruta={`/staff/pagos/${pago.id}/comprobante`} alt="Comprobante de pago" />

        <p className="mt-3 text-xs text-muted-foreground">Estado: {pago.comprobante_revision ? REVISION_LABEL[pago.comprobante_revision] : '—'}</p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {pago.comprobante_revision !== 'invalido' && (
          confirmandoInvalido ? (
            <div className="mt-4 rounded-lg border border-danger p-3 text-sm">
              <p>Se cancelará la cita, se liberará el horario y se avisará al paciente. ¿Continuar?</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => revisar('invalido')} disabled={guardando} className="rounded border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger hover:text-white disabled:opacity-50">Sí, anular</button>
                <button onClick={() => setConfirmandoInvalido(false)} className="rounded border border-border px-3 py-1.5 text-xs">No</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              {pago.comprobante_revision !== 'valido' && (
                <button onClick={() => revisar('valido')} disabled={guardando} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">Válido</button>
              )}
              <button onClick={() => setConfirmandoInvalido(true)} disabled={guardando} className="flex-1 rounded-lg border border-danger px-3 py-2 text-sm font-medium text-danger disabled:opacity-50">Inválido</button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
