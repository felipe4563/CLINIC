'use client';

import { useState } from 'react';
import Link from 'next/link';
import { REVISION_LABEL, REVISION_COLOR, fmtFechaHora } from './politica';

export type PagoCita = {
  id: number;
  monto: string;
  monto_total: string;
  porcentaje: number;
  estado: 'pendiente' | 'pagado' | 'fallido';
  metodo_adelanto: 'qr_banco' | 'qr_fijo' | null;
  comprobante_revision: 'sin_revisar' | 'valido' | 'invalido' | null;
  tieneComprobante: boolean;
};

export type PoliticaCita = {
  conAdelanto: boolean;
  montoRetenido: boolean;
  puedeJustificar: boolean;
  puedeReprogramar: boolean;
  limiteJustificar: string;
  justificacionFueraDePlazo: boolean;
  limiteReprogramar: string | null;
  reprogramacionFueraDePlazo: boolean;
};

export type AccionCita = 'comprobante' | 'justificar' | 'reprogramar' | 'verJustificacion';

export type Cita = {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente_pago' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';
  Paciente: {
    id: number;
    nombre_completo: string;
    telefono: string;
    carnet_identidad: string;
    carnet_complemento?: string | null;
  };
  Profesional: { id: number; nombre: string };
  Servicio: { id: number; nombre: string; precio?: string };
  Pago: PagoCita | null;
  politica: PoliticaCita;
  justificacion_estado: 'aceptada' | 'rechazada' | null;
  justificacion_nota: string | null;
  tieneJustificacion: boolean;
  reprogramacion_usada: boolean;
  fecha_original: string | null;
  hora_original: string | null;
};

const ESTADO_LABEL: Record<Cita['estado'], string> = {
  pendiente_pago: 'Pendiente de pago',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

const ESTADO_DOT: Record<Cita['estado'], string> = {
  confirmada: 'var(--stat-green)',
  pendiente_pago: 'var(--stat-amber)',
  cancelada: 'var(--muted-foreground)',
  completada: 'var(--stat-blue)',
  no_asistio: 'var(--stat-rose)',
};

function hora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

export default function DayAgendaCards({
  citas,
  mostrarProfesional,
  onEstadoChange,
  onAccion,
  mostrarFecha = false,
}: {
  citas: Cita[];
  mostrarProfesional: boolean;
  onEstadoChange: (cita: Cita, estado: Cita['estado']) => void;
  onAccion: (cita: Cita, accion: AccionCita) => void;
  mostrarFecha?: boolean;
}) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  const ordenadas = [...citas].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  if (ordenadas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">No hay citas este día</p>
        <p className="mt-1 text-sm text-muted-foreground">Usa &ldquo;+ Nueva cita&rdquo; para agendar una.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {ordenadas.map((cita) => {
        const abierta = expandidoId === cita.id;
        return (
          <div
            key={cita.id}
            className="overflow-hidden rounded-xl border border-border bg-panel transition-colors"
            style={{ borderLeftWidth: 4, borderLeftColor: ESTADO_DOT[cita.estado] }}
          >
            <button
              onClick={() => setExpandidoId(abierta ? null : cita.id)}
              aria-expanded={abierta}
              aria-controls={`cita-detalle-${cita.id}`}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {mostrarFecha ? `${cita.fecha} · ` : ''}{hora(cita.hora_inicio)} – {hora(cita.hora_fin)}
                </p>
                <p className="mt-0.5 truncate text-sm">{cita.Paciente.nombre_completo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {cita.Servicio.nombre}
                  {mostrarProfesional ? ` · ${cita.Profesional.nombre}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: `${ESTADO_DOT[cita.estado]}22`, color: ESTADO_DOT[cita.estado] }}
                >
                  {ESTADO_LABEL[cita.estado]}
                </span>
                {cita.Pago?.comprobante_revision && cita.estado !== 'cancelada' && (
                  <span
                    {...(cita.Pago.tieneComprobante
                      ? {
                          role: 'button',
                          tabIndex: 0,
                          title: 'Ver comprobante',
                          onClick: (e: React.MouseEvent) => {
                            e.stopPropagation();
                            onAccion(cita, 'comprobante');
                          },
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onAccion(cita, 'comprobante');
                            }
                          },
                        }
                      : {})}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cita.Pago.tieneComprobante ? 'cursor-pointer hover:opacity-80' : ''}`}
                    style={{ background: `${REVISION_COLOR[cita.Pago.comprobante_revision]}22`, color: REVISION_COLOR[cita.Pago.comprobante_revision] }}
                  >
                    {REVISION_LABEL[cita.Pago.comprobante_revision]}
                  </span>
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted-foreground transition-transform ${abierta ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            <div
              id={`cita-detalle-${cita.id}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${abierta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-sm">
                  <a href={`tel:${cita.Paciente.telefono}`} className="text-accent hover:underline">
                    {cita.Paciente.telefono}
                  </a>
                  <p className="text-muted-foreground">
                    Carnet {cita.Paciente.carnet_identidad}
                    {cita.Paciente.carnet_complemento ? `-${cita.Paciente.carnet_complemento}` : ''}
                  </p>
                  {cita.Servicio.precio && <p className="text-muted-foreground">Bs {cita.Servicio.precio}</p>}
                  {mostrarProfesional && <p className="text-muted-foreground">Con {cita.Profesional.nombre}</p>}

                  {cita.Pago?.tieneComprobante && (
                    <button type="button" onClick={() => onAccion(cita, 'comprobante')} className="self-start text-sm text-accent hover:underline">
                      Ver comprobante →
                    </button>
                  )}

                  {cita.estado === 'no_asistio' && cita.politica.conAdelanto && (
                    <div className="rounded-lg border border-border bg-background p-2 text-xs">
                      {cita.politica.montoRetenido && cita.reprogramacion_usada && (
                        <p className="text-danger">No asistió a la cita reprogramada · monto retenido (Bs {cita.Pago?.monto})</p>
                      )}
                      {cita.politica.montoRetenido && !cita.justificacion_estado && (
                        <p className={cita.politica.justificacionFueraDePlazo ? 'text-stat-amber' : 'text-muted-foreground'}>
                          Monto retenido (Bs {cita.Pago?.monto}) ·{' '}
                          {cita.politica.justificacionFueraDePlazo ? 'fuera de plazo' : `puede justificar hasta el ${fmtFechaHora(cita.politica.limiteJustificar)}`}
                        </p>
                      )}
                      {cita.justificacion_estado === 'rechazada' && <p className="text-danger">Justificación rechazada · monto retenido</p>}
                      {cita.justificacion_estado === 'aceptada' && <p className="text-stat-green">Justificación aceptada</p>}
                      {cita.justificacion_nota && <p className="mt-1 text-muted-foreground">“{cita.justificacion_nota}”</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cita.politica.puedeJustificar && (
                          <button type="button" onClick={() => onAccion(cita, 'justificar')} className="rounded border border-border px-2 py-1 hover:bg-accent-soft">Registrar justificación</button>
                        )}
                        {cita.politica.puedeReprogramar && (
                          <button type="button" onClick={() => onAccion(cita, 'reprogramar')} className="rounded border border-accent px-2 py-1 text-accent hover:bg-accent-soft">Reprogramar</button>
                        )}
                        {cita.tieneJustificacion && (
                          <button type="button" onClick={() => onAccion(cita, 'verJustificacion')} className="rounded border border-border px-2 py-1 hover:bg-accent-soft">Ver prueba</button>
                        )}
                      </div>
                    </div>
                  )}

                  {cita.reprogramacion_usada && cita.fecha_original && (
                    <p className="text-xs text-muted-foreground">
                      Reprogramada desde el {cita.fecha_original} {cita.hora_original?.slice(0, 5)} · ya se reprogramó una vez
                    </p>
                  )}

                  <select
                    value={cita.estado}
                    onChange={(e) => onEstadoChange(cita, e.target.value as Cita['estado'])}
                    className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                  >
                    <option value="pendiente_pago">Pendiente de pago</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="no_asistio">No asistió</option>
                    <option value="cancelada">Cancelada</option>
                  </select>

                  <Link href={`/pacientes/${cita.Paciente.id}`} className="mt-1 text-sm text-accent hover:underline">
                    Ver ficha completa →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
